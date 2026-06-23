export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  website?: string;
  gender?: string;
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
  type: 'QUOTE' | 'THOUGHT' | 'PROGRESS_UPDATE';
  bookId?: string;
  bookTitle?: string;
  content: string;
  currentPage?: number;
  totalPages?: number;
  likes: string[]; // array of userIds
  comments: Comment[];
  createdAt: string;
}

export interface ReadingGoal {
  userId: string;
  year: number;
  targetBooks: number;
  completedBooksCount: number;
}
