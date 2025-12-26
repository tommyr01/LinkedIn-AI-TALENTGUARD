import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

// Types for authentication
export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user' | 'viewer'
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface AuthSession {
  user: User
  token: string
  expires_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  role?: 'admin' | 'user' | 'viewer'
}

export interface JWTTokenPayload extends JWTPayload {
  user_id: string
  email: string
  role: string
  session_id: string
}

// Environment variables for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// Convert JWT_EXPIRES_IN to seconds for token expiry
const getExpiryTime = (expiresIn: string): number => {
  const now = Math.floor(Date.now() / 1000)
  
  if (expiresIn.endsWith('h')) {
    const hours = parseInt(expiresIn.slice(0, -1))
    return now + (hours * 60 * 60)
  } else if (expiresIn.endsWith('d')) {
    const days = parseInt(expiresIn.slice(0, -1))
    return now + (days * 24 * 60 * 60)
  } else if (expiresIn.endsWith('m')) {
    const minutes = parseInt(expiresIn.slice(0, -1))
    return now + (minutes * 60)
  }
  
  // Default to 24 hours
  return now + (24 * 60 * 60)
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export async function generateToken(payload: Omit<JWTTokenPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const expiryTime = getExpiryTime(JWT_EXPIRES_IN)
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiryTime)
    .sign(secret)
    
  return token
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTTokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Create user session in database
export async function createSession(userId: string, tokenHash: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const expiryTime = getExpiryTime(JWT_EXPIRES_IN)
  const expiresAt = new Date(expiryTime * 1000).toISOString()
  
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true
    })
    .select('id')
    .single()
    
  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }
  
  return data.id
}

// Invalidate session
export async function invalidateSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    
  if (error) {
    throw new Error(`Failed to invalidate session: ${error.message}`)
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single()
    
  if (error || !data) {
    return null
  }
  
  return data as User
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()
    
  if (error || !data) {
    return null
  }
  
  return data as User
}

// Update user last login
export async function updateLastLogin(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ 
      last_login: new Date().toISOString(),
      failed_login_attempts: 0,
      locked_until: null
    })
    .eq('id', userId)
    
  if (error) {
    console.error('Failed to update last login:', error)
  }
}

// Handle failed login attempt
export async function handleFailedLogin(email: string): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('failed_login_attempts')
    .eq('email', email.toLowerCase())
    .single()
    
  if (user) {
    const failedAttempts = (user.failed_login_attempts || 0) + 1
    const lockedUntil = failedAttempts >= 5 
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // Lock for 15 minutes after 5 failed attempts
      : null
      
    await supabase
      .from('users')
      .update({ 
        failed_login_attempts: failedAttempts,
        locked_until: lockedUntil
      })
      .eq('email', email.toLowerCase())
  }
}

// Check if user account is locked
export async function isAccountLocked(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('locked_until')
    .eq('email', email.toLowerCase())
    .single()
    
  if (data?.locked_until) {
    return new Date(data.locked_until) > new Date()
  }
  
  return false
}

// Login user
export async function loginUser(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthSession> {
  const { email, password } = credentials
  
  // Check if account is locked
  if (await isAccountLocked(email)) {
    throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.')
  }
  
  // Get user by email
  const user = await getUserByEmail(email)
  if (!user) {
    await handleFailedLogin(email)
    throw new Error('Invalid email or password')
  }
  
  // Get password hash from database
  const { data: userCredentials } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', user.id)
    .single()
    
  if (!userCredentials) {
    await handleFailedLogin(email)
    throw new Error('Invalid email or password')
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(password, userCredentials.password_hash)
  if (!isValidPassword) {
    await handleFailedLogin(email)
    throw new Error('Invalid email or password')
  }
  
  // Create session
  const sessionId = await createSession(user.id, 'placeholder-hash', ipAddress, userAgent)
  
  // Generate JWT token
  const token = await generateToken({
    user_id: user.id,
    email: user.email,
    role: user.role,
    session_id: sessionId
  })
  
  // Update last login
  await updateLastLogin(user.id)
  
  // Log successful login
  await logAuditEvent(user.id, 'LOGIN_SUCCESS', 'authentication', ipAddress, userAgent)
  
  const expiryTime = getExpiryTime(JWT_EXPIRES_IN)
  
  return {
    user,
    token,
    expires_at: new Date(expiryTime * 1000).toISOString()
  }
}

// Register new user
export async function registerUser(userData: RegisterData): Promise<User> {
  const { email, password, full_name, role = 'user' } = userData
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }
  
  // Hash password
  const password_hash = await hashPassword(password)
  
  // Create user
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      full_name,
      role,
      is_active: true
    })
    .select('id, email, full_name, role, is_active, created_at')
    .single()
    
  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }
  
  // Create default user preferences
  await supabase
    .from('user_preferences')
    .insert({
      user_id: data.id,
      tone_profiles: [],
      ai_settings: {},
      notification_settings: {}
    })
    
  return data as User
}

// Logout user
export async function logoutUser(sessionId: string, userId?: string): Promise<void> {
  await invalidateSession(sessionId)
  
  if (userId) {
    await logAuditEvent(userId, 'LOGOUT', 'authentication')
  }
}

// Validate session and get current user
export async function validateSession(token: string): Promise<{ user: User; sessionId: string } | null> {
  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }
  
  // Check if session is still active
  const { data: session } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('id', payload.session_id)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .single()
    
  if (!session) {
    return null
  }
  
  // Get current user data
  const user = await getUserById(payload.user_id)
  if (!user) {
    return null
  }
  
  return {
    user,
    sessionId: payload.session_id
  }
}

// Log audit events
export async function logAuditEvent(
  userId: string | null,
  action: string,
  resource?: string,
  ipAddress?: string,
  userAgent?: string,
  success: boolean = true,
  errorMessage?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        error_message: errorMessage,
        metadata: metadata || {}
      })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

// Initialize admin user (run this once)
export async function initializeAdminUser(): Promise<void> {
  const adminEmail = 'admin@talentguard.com'
  const existingAdmin = await getUserByEmail(adminEmail)
  
  if (!existingAdmin) {
    await registerUser({
      email: adminEmail,
      password: 'TalentGuard2024!',
      full_name: 'System Administrator',
      role: 'admin'
    })
    console.log('Admin user created with email:', adminEmail)
  }
}