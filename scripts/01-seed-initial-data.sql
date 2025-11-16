-- Script de inicialización de la base de datos
-- Este script crea un usuario admin y categorías iniciales

-- Usuario admin (password: admin123)
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'admin@pos.com',
  '$2a$10$rOzJqY9qGN7K3KVH1x5b5eYQZx7Dn5W2YQZx7Dn5W2YQZx7Dn5W2Y',
  'Administrador',
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Usuario vendedor (password: vendedor123)
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  'vendedor-001',
  'vendedor@pos.com',
  '$2a$10$rOzJqY9qGN7K3KVH1x5b5eYQZx7Dn5W2YQZx7Dn5W2YQZx7Dn5W2Y',
  'Vendedor',
  'VENDEDOR',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Categorías iniciales
INSERT INTO "Category" (id, name, color) VALUES
  ('cat-001', 'Electrónica', '#3b82f6'),
  ('cat-002', 'Ropa', '#10b981'),
  ('cat-003', 'Alimentos', '#f59e0b'),
  ('cat-004', 'Hogar', '#8b5cf6'),
  ('cat-005', 'Deportes', '#ef4444')
ON CONFLICT (name) DO NOTHING;
