import { NextRequest, NextResponse } from 'next/server'
import { 
  companyOperations, 
  contactOperations, 
  signalOperations, 
  activityOperations 
} from '@/lib/airtable'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data parameters are required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (type) {
      case 'company':
        result = await companyOperations.create(data)
        break
      
      case 'contact':
        result = await contactOperations.create(data)
        break
      
      case 'signal':
        result = await signalOperations.create(data)
        break
      
      case 'activity':
        result = await activityOperations.log(data)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid sync type' },
          { status: 400 }
        )
    }

    if (result?.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: `${type} synced to Airtable successfully`
      })
    } else {
      return NextResponse.json(
        { error: result?.error || 'Sync failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Airtable sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (type) {
      case 'companies':
        result = await companyOperations.findAll()
        break
      
      case 'contacts':
        result = await contactOperations.findAll()
        break
      
      case 'signals':
        result = await signalOperations.findRecent()
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid data type' },
          { status: 400 }
        )
    }

    if (result?.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result?.error || 'Fetch failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Airtable fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}