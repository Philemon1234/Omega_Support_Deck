CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id SERIAL PRIMARY KEY,
  message_body TEXT NOT NULL,
  send_type VARCHAR(20) NOT NULL DEFAULT 'immediate',
  recipient_type VARCHAR(20) NOT NULL DEFAULT 'all',
  recipient_customer_id INTEGER NULL REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  total_recipients INTEGER DEFAULT 0,
  valid_recipients INTEGER DEFAULT 0,
  invalid_recipients INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  provider VARCHAR(50) DEFAULT 'UGSMS',
  provider_response TEXT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_recipients (
  id SERIAL PRIMARY KEY,
  sms_message_id INTEGER NOT NULL REFERENCES sms_messages(id) ON DELETE CASCADE,
  customer_id INTEGER NULL REFERENCES customers(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
