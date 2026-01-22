-- Inserir configurações iniciais
INSERT INTO settings (id, interval_minutes, schedule) 
VALUES (
  1, 
  45, 
  '[
    {"dayId":0,"isOpen":false,"openTime":"09:00","closeTime":"18:00"},
    {"dayId":1,"isOpen":true,"openTime":"09:00","closeTime":"19:00","breakStart":"12:00","breakEnd":"13:00"},
    {"dayId":2,"isOpen":true,"openTime":"09:00","closeTime":"19:00","breakStart":"12:00","breakEnd":"13:00"},
    {"dayId":3,"isOpen":true,"openTime":"09:00","closeTime":"19:00","breakStart":"12:00","breakEnd":"13:00"},
    {"dayId":4,"isOpen":true,"openTime":"09:00","closeTime":"19:00","breakStart":"12:00","breakEnd":"13:00"},
    {"dayId":5,"isOpen":true,"openTime":"09:00","closeTime":"19:00","breakStart":"12:00","breakEnd":"13:00"},
    {"dayId":6,"isOpen":true,"openTime":"09:00","closeTime":"17:00"}
  ]'::jsonb
) 
ON CONFLICT (id) DO NOTHING;
