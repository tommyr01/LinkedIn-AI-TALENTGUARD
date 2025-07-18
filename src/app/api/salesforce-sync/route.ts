import { NextRequest, NextResponse } from 'next/server'
import { 
  accountOperations, 
  contactOperations, 
  leadOperations, 
  opportunityOperations,
  taskOperations,
  syncOperations
} from '@/lib/salesforce'

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
      case 'account':
        result = await accountOperations.create(data)
        break
      
      case 'contact':
        result = await contactOperations.create(data)
        break
      
      case 'lead':
        result = await leadOperations.create(data)
        break
      
      case 'opportunity':
        result = await opportunityOperations.create(data)
        break
      
      case 'task':
        result = await taskOperations.create(data)
        break
      
      case 'bulk_sync':
        result = await syncOperations.syncToSalesforce(data)
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
        message: `${type} synced to Salesforce successfully`
      })
    } else {
      return NextResponse.json(
        { error: result?.error || 'Sync failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Salesforce sync error:', error)
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
    const identifier = searchParams.get('identifier')

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (type) {
      case 'accounts':
        result = await accountOperations.findAll()
        break
      
      case 'account':
        if (!identifier) {
          return NextResponse.json(
            { error: 'Identifier parameter is required for account lookup' },
            { status: 400 }
          )
        }
        result = await accountOperations.findByName(identifier)
        break
      
      case 'contact':
        if (!identifier) {
          return NextResponse.json(
            { error: 'Identifier parameter is required for contact lookup' },
            { status: 400 }
          )
        }
        result = await contactOperations.findByEmail(identifier)
        break
      
      case 'contacts':
        if (!identifier) {
          return NextResponse.json(
            { error: 'Account ID parameter is required for contacts lookup' },
            { status: 400 }
          )
        }
        result = await contactOperations.findByAccount(identifier)
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
    console.error('Salesforce fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}