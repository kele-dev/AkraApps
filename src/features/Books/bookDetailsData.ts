export interface RichBookDetail {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  totalPages: number;
  category: string;
  rating: number;
  ratingsCount: number;
  reviewsCount: number;
  description: string;
  genres: string[];
  publishedDate: string;
  binding: string;
  tagline?: string;
  authorAvatar?: string;
  authorBio?: string;
  authorStats?: string;
  currentlyReadingCount?: number;
  wantToReadCount?: number;
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  editionLanguage?: string;
  characters?: string[];
  setting?: string;
}

export const getRichBookDetail = (book: { id: string; title: string; author: string; coverImage: string; totalPages: number; category?: string }): RichBookDetail => {
  // Procedural generation for book details fallback
  const titleCharSum = book.title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const authorCharSum = book.author.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const seed = titleCharSum + authorCharSum;

  const rating = 0;
  const ratingsCount = 0;
  const reviewsCount = 0;
  
  const category = book.category || 'Fiksi';
  const genres = [category];
  if (category === 'Fiksi' || category === 'Fiction') {
    genres.push('Novels', 'Fiction', 'Literature');
  } else if (category === 'Self-Improvement' || category === 'Self-Help') {
    genres.push('Nonfiction', 'Psychology', 'Productivity');
  } else if (category === 'Filsafat' || category === 'Philosophy') {
    genres.push('Nonfiction', 'Philosophy', 'Intellectual');
  } else {
    genres.push('Nonfiction', 'General');
  }

  const yearsAgo = (seed % 25) + 1;
  const publishedYear = 2026 - yearsAgo;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const publishedMonth = months[seed % 12];
  const publishedDay = (seed % 28) + 1;
  const publishedDate = `${publishedMonth} ${publishedDay}, ${publishedYear}`;
  
  const binding = seed % 3 === 0 ? 'Hardcover' : 'Paperback';
  
  const description = `Buku "${book.title}" merupakan karya luar biasa dari ${book.author} yang membahas tema mendalam seputar ${genres.join(', ')}. Ditulis dengan gaya yang memikat dan alur pemikiran yang runut, buku ini menyajikan wawasan mendalam dan perspektif baru bagi pembacanya.\n\nSebuah bacaan yang sangat direkomendasikan untuk siapa saja yang ingin memperluas cakrawala berpikir dan menemukan inspirasi berharga di setiap halamannya.`;

  const authorAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
  const authorBio = `${book.author} adalah seorang penulis profesional yang berfokus pada bidang ${category}. Melalui karya-karyanya, ia berusaha memberikan dampak positif dan berbagi perspektif yang mencerahkan bagi komunitas pembaca di seluruh dunia.`;
  const authorStats = `0 books · 0 followers`;
  
  const currentlyReadingCount = 0;
  const wantToReadCount = 0;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverImage: book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
    totalPages: book.totalPages || 200,
    category: category,
    rating,
    ratingsCount,
    reviewsCount,
    description,
    genres,
    publishedDate,
    binding,
    tagline: `Why do you do what you do?`,
    authorAvatar,
    authorBio,
    authorStats,
    currentlyReadingCount,
    wantToReadCount
  };
};
