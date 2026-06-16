import pg from "./node_modules/pg/lib/index.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
TRUNCATE vehicles, route_stops, stops, routes RESTART IDENTITY CASCADE;

INSERT INTO routes (name, number, type, color, start_stop, end_stop, total_stops, frequency, is_active) VALUES
  ('Blue Line', 'M1', 'metro', '#2563EB', 'Airport', 'Wimco Nagar', 4, 'Every 5 mins', true),
  ('Broadway - Tambaram', '21G', 'bus', '#F97316', 'Broadway', 'Tambaram', 4, 'Every 10 mins', true),
  ('MRTS Beach - Velachery', 'MR1', 'suburban-rail', '#16A34A', 'Beach', 'Velachery', 4, 'Every 12 mins', true);

INSERT INTO stops (name, lat, lng, type, address) VALUES
  ('Chennai Airport', 12.9941, 80.1709, 'metro', 'GST Road'),
  ('Meenambakkam', 12.9887, 80.1764, 'metro', 'GST Road'),
  ('Nanganallur Road', 12.9750, 80.1910, 'metro', 'Nanganallur'),
  ('Wimco Nagar', 13.1608, 80.3001, 'metro', 'Ennore'),
  ('Broadway', 13.0878, 80.2785, 'bus', 'George Town'),
  ('T. Nagar', 13.0418, 80.2341, 'bus', 'Pondy Bazaar'),
  ('Guindy', 13.0108, 80.2120, 'bus', 'Race Course Road'),
  ('Tambaram', 12.9249, 80.1000, 'bus', 'GST Road'),
  ('Beach', 13.0880, 80.2930, 'suburban-rail', 'Beach Station'),
  ('Park Town', 13.0800, 80.2750, 'suburban-rail', 'Park Town'),
  ('Mylapore', 13.0368, 80.2676, 'suburban-rail', 'Luz Corner'),
  ('Velachery', 12.9815, 80.2180, 'suburban-rail', 'Velachery Main Road');

INSERT INTO route_stops (route_id, stop_id, sequence) VALUES
  (1, 1, 0), (1, 2, 1), (1, 3, 2), (1, 4, 3),
  (2, 5, 0), (2, 6, 1), (2, 7, 2), (2, 8, 3),
  (3, 9, 0), (3, 10, 1), (3, 11, 2), (3, 12, 3);

INSERT INTO vehicles (id, route_id, lat, lng, speed, direction, occupancy, last_updated) VALUES
  ('M1-1', 1, 12.9941, 80.1709, 35.00, 90, 'low', NOW()::text),
  ('M1-2', 1, 12.9887, 80.1764, 42.00, 120, 'medium', NOW()::text),
  ('21G-1', 2, 13.0878, 80.2785, 28.00, 180, 'low', NOW()::text),
  ('21G-2', 2, 13.0418, 80.2341, 31.00, 200, 'high', NOW()::text),
  ('MR1-1', 3, 13.0880, 80.2930, 55.00, 210, 'medium', NOW()::text),
  ('MR1-2', 3, 13.0800, 80.2750, 48.00, 190, 'low', NOW()::text);
`;

async function main() {
  await pool.query(sql);
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM routes) AS routes,
      (SELECT COUNT(*) FROM stops) AS stops,
      (SELECT COUNT(*) FROM vehicles) AS vehicles
  `);
  console.log("Seed complete:", counts.rows[0]);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
