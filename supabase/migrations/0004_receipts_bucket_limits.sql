-- Receipt photos are re-encoded to JPEG on the phone (lib/receipt/image) well under 5 MB;
-- cap the private bucket so an authenticated user cannot fill their folder with arbitrary files.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'receipts';
