-- Map Manara Zion "He Can Album" songs
UPDATE songs SET album_id = '1f01e9d9-6551-4189-b643-defafe33723d'
WHERE artist_id = 'a0000001-0000-0000-0000-000000000001'
  AND (title ILIKE '%He Can Album%' OR title = 'He Can by Manara Zion' OR title = 'Kulu Haja by Manara Zion | He Can Album');

-- Map St Mary Wau Catholic songs
UPDATE songs SET album_id = '2ce7cec0-8154-49a7-b722-f23bf6f519e2'
WHERE artist_id = 'a0000001-0000-0000-0000-000000000003';

-- Map James Mawien songs to Wadang
UPDATE songs SET album_id = '811063a2-4036-4b31-b19c-52d8d676dc99'
WHERE artist_id IN (SELECT id FROM artists WHERE lower(name) = 'james mawien');