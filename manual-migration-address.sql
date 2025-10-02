-- Add address column to images table for reverse geocoded addresses
ALTER TABLE images ADD COLUMN address TEXT;

-- Add index for address column for better query performance
CREATE INDEX idx_images_address ON images(address);

-- Add comment to document the column purpose
COMMENT ON COLUMN images.address IS 'Reverse geocoded address from coordinates using OpenStreetMap Nominatim API';
