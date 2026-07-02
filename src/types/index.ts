export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  website?: string;
  gender?: string;
  location?: string;
  joinedAt?: string;
  followingIds?: string[];
  followerIds?: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  totalPages: number;
  category?: string;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  currentPage: number;
  status: 'WANT_TO_READ' | 'READING' | 'COMPLETED';
  rating?: number;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string;
  type: 'QUOTE' | 'THOUGHT' | 'PROGRESS_UPDATE' | 'PHOTO';
  bookId?: string;
  bookTitle?: string;
  content: string;
  imageUrl?: string;   // base64 or URL for photo posts
  currentPage?: number;
  totalPages?: number;
  likes: string[]; // array of userIds
  comments: Comment[];
  rating?: number;
  createdAt: string;
}

export interface ReadingGoal {
  userId: string;
  year: number;
  targetBooks: number;
  completedBooksCount: number;
}

export interface Story {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string;
  bookTitle?: string;
  content: string;
  createdAt: string;
}

export interface Shelf {
  id: string;
  userId: string;
  name: string;
  bookIds: string[];
}

export interface BuddyRead {
  id: string;
  userIds: string[];
  bookId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // who receives the notification
  fromUserId: string;
  fromUserDisplayName: string;
  fromUserAvatar: string;
  type: 'LIKE' | 'COMMENT' | 'PROGRESS' | 'BUDDY_READ' | 'COMPLETED';
  message: string;
  postId?: string;
  bookTitle?: string;
  isRead: boolean;
  createdAt: string;
}

export interface BuddyMessage {
  id: string;
  buddyReadId: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

