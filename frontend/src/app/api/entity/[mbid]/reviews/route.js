// src/app/api/entity/[mbid]/reviews/route.js
import { NextResponse } from 'next/server';
import { getEntityPublicReviewsAndRatings } from '@/lib/supabase/journals';

export async function GET(request, { params }) {
  try {
    const { mbid } = await params;
    if (!mbid) {
      return NextResponse.json({ error: 'MBID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'recent'; // 'recent' | 'highest'

    const { summary, reviews } = await getEntityPublicReviewsAndRatings(mbid);

    const sortedReviews = [...reviews];
    if (sort === 'highest') {
      sortedReviews.sort((a, b) => {
        const diff = (b.rating || 0) - (a.rating || 0);
        if (diff !== 0) return diff;
        return new Date(b.listenedDate || b.createdAt).getTime() - new Date(a.listenedDate || a.createdAt).getTime();
      });
    } else {
      sortedReviews.sort((a, b) => {
        const dateDiff =
          new Date(b.listenedDate || b.createdAt).getTime() -
          new Date(a.listenedDate || a.createdAt).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json(
      { summary, reviews: sortedReviews },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Entity reviews GET error:', error);
    return NextResponse.json(
      {
        summary: {
          total_ratings: 0,
          avg_stars: null,
          avg_score: null,
          normalized_score_100: null,
          avg_rating_10: null,
        },
        reviews: [],
      },
      { status: 500 }
    );
  }
}
