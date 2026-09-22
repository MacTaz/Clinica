-- Fixed reference list — see docs/DATA_MODEL.md and the Limitations
-- section of the project doc: specializations are not editable via the API.
INSERT INTO specializations (name) VALUES
    ('General Medicine'),
    ('Pediatrics'),
    ('Dermatology'),
    ('Cardiology')
ON DUPLICATE KEY UPDATE name = name;
