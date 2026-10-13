// Item list Bapenda — dibaca dari ../seloko-api/src/modules/{bapenda,shared/article}/*.schema.ts

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'

export interface ArticleListItem {
  id: string
  title: string
  slug: string
  status: ArticleStatus
  publishedAt?: string | null
  viewCount: number
  createdAt: string
  category?: { id: string; name: string; slug: string }
  author?: { id: string; fullName: string }
}

export interface ArticleCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive: boolean
  sortOrder: number
}

export interface BannerListItem {
  id: string
  title: string
  imageUrl: string
  buttonUrl?: string | null
  sortOrder: number
  isActive: boolean
}

export interface PageListItem {
  id: string
  title: string
  slug: string
  isPublished: boolean
  publishedAt?: string | null
  updatedAt: string
}
