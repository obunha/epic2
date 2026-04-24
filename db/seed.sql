-- Seed data for The EpicBook
USE bookstore;

-- Insert authors
INSERT INTO Authors (author_name) VALUES
  ('George Orwell'),
  ('Harper Lee'),
  ('F. Scott Fitzgerald'),
  ('Jane Austen'),
  ('Mark Twain');

-- Insert books
INSERT INTO Books (title, author_id, price, genre, stock) VALUES
  ('1984', 1, 12.99, 'Fiction', 50),
  ('Animal Farm', 1, 9.99, 'Fiction', 35),
  ('To Kill a Mockingbird', 2, 14.99, 'Classic', 40),
  ('The Great Gatsby', 3, 11.99, 'Classic', 30),
  ('Pride and Prejudice', 4, 10.99, 'Romance', 45),
  ('Adventures of Huckleberry Finn', 5, 13.99, 'Adventure', 25);