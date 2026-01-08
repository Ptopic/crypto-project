import { NextResponse } from 'next/server';
import { getTimeRangeBlocks } from '@/services/rpc';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Request query:', { timeRange, page, limit });

    const blocks = await getTimeRangeBlocks(timeRange, page, limit);

    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
}
