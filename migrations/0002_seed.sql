-- Seed data — derived from Nanda Kumar's resume.
-- Re-runnable: clears and reloads everything except contact_messages.

DELETE FROM awards;
DELETE FROM certifications;
DELETE FROM education;
DELETE FROM skills;
DELETE FROM projects;
DELETE FROM experience;
DELETE FROM social_links;
DELETE FROM profile;

INSERT INTO profile
  (id, full_name, title, tagline, summary, location, email, phone, available, years_experience)
VALUES (
  1,
  'Nanda Kumar',
  'Software Engineer · GenAI & Automation',
  'I architect AI-driven internal tools and large-scale automation for Fortune 100 platforms.',
  'Software Engineer with 3+ years of experience designing and deploying high-traffic applications for Fortune 100 e-commerce and enterprise sectors. Expert in Python, Java, and Generative AI integration, with a proven track record of architecting internal tools that improved operational efficiency by 45%. Certified MongoDB Architect dedicated to building scalable, mission-critical systems with 99.9% uptime.',
  'Bengaluru, India',
  'nandakumar1052@gmail.com',
  '+91 92062 57512',
  1,
  3
);

INSERT INTO social_links (label, url, sort_order) VALUES
  ('Portfolio','https://nandakumaronline.com',                    0),
  ('GitHub',   'https://github.com/nandakumar1052',              1),
  ('LinkedIn', 'https://www.linkedin.com/in/nanda-kumar-profile', 2),
  ('Email',    'mailto:nandakumar1052@gmail.com',                 3);

INSERT INTO experience
  (company, role, location, start_date, end_date, summary, highlights, technologies, sort_order)
VALUES (
  'Accenture',
  'Software Engineer',
  'Bengaluru, India',
  '2022-10',
  NULL,
  'Building GenAI-powered internal tooling, monitoring automation, and order-flow analytics for a Fortune 100 retailer.',
  json_array(
    'Architected a GenAI assistant grounded in 200+ internal SOPs, cutting incident resolution time by 90% across L1/L2 support.',
    'Designed and shipped 30+ Slack chatbots that surface real-time order, payment, and inventory signals to 500+ daily users.',
    'Built 100+ Python and Selenium automation pipelines for proactive monitoring and anomaly detection, saving 32 hours of manual effort per week.',
    'Engineered a React + FastAPI dashboard analyzing 10,000+ concurrent order flows in real time, preventing critical failures during peak holiday traffic.',
    'Maintained 99.9% uptime on mission-critical services and led RCA for high-impact production incidents.',
    'Won the Accenture ACE award for measurable impact on platform reliability and engineer productivity.'
  ),
  json_array('Python','FastAPI','Flask','Java','React','MongoDB','CockroachDB','AWS','Selenium','Slack API','OpenAI','Gemini','Llama','Grafana','Dynatrace','Docker','Kubernetes'),
  1
);

INSERT INTO projects
  (title, slug, tagline, description, impact, technologies, repo_url, demo_url, featured, sort_order)
VALUES
(
  'SOP-Grounded GenAI Support Assistant',
  'genai-support-assistant',
  'LLM agent that triages production incidents against internal runbooks.',
  'Retrieval-augmented Slack assistant that indexes 200+ internal SOPs and Confluence runbooks. Routes incidents to the correct on-call, summarizes prior similar tickets, and suggests next actions. Uses GPT-4o for reasoning and an embedding cache to keep latency under 2s p95.',
  'Cut mean time to resolution by ~90% and removed dozens of repetitive lookups from L1/L2 oncall rotations.',
  json_array('Python','FastAPI','OpenAI GPT-4o','Vector search','Slack Bolt','MongoDB','AWS'),
  NULL,
  NULL,
  1,
  1
),
(
  'Real-Time Order Flow Dashboard',
  'order-flow-dashboard',
  'React + FastAPI control tower for 10,000+ concurrent orders.',
  'A holiday-grade observability dashboard for a Fortune 100 retailer. Streams order state changes, surfaces stuck flows, and lets oncall trigger remediation actions inline. Battle-tested through peak Black Friday / Cyber Monday traffic.',
  'Prevented critical SEV-1 incidents during peak holiday traffic and gave business stakeholders a live single-pane-of-glass view.',
  json_array('React','FastAPI','MongoDB','CockroachDB','WebSockets','Grafana','Docker'),
  NULL,
  NULL,
  1,
  2
),
(
  'Selenium + Python Anomaly Detection Suite',
  'automation-pipelines',
  '100+ scheduled pipelines for proactive checks across the order stack.',
  'Catalog of headless Selenium and Python jobs that simulate user-critical journeys, validate API contracts, and detect data anomalies before they reach customers. Findings are routed to Slack and PagerDuty.',
  'Saved 32 hours of manual QA / monitoring effort per week and surfaced regressions hours before customers reported them.',
  json_array('Python','Selenium','Jenkins','GitHub Actions','Slack API','Grafana'),
  NULL,
  NULL,
  1,
  3
),
(
  'PyQt5 Internal Desktop Toolkit',
  'pyqt5-toolkit',
  'Windows desktop utilities for engineers without web access.',
  'Suite of PyQt5 desktop apps that bundle frequently-used scripts (log scraping, environment switching, deploy helpers) into a signed Windows installer for the broader engineering org.',
  'Standardized day-to-day engineering workflows for 100+ internal users and reduced onboarding setup time from days to hours.',
  json_array('Python','PyQt5','Windows','MSI installer'),
  NULL,
  NULL,
  0,
  4
);

INSERT INTO skills (category, name, level, sort_order) VALUES
  ('Languages',          'Python',      5, 1),
  ('Languages',          'Java',        4, 2),
  ('Languages',          'JavaScript',  4, 3),
  ('Languages',          'TypeScript',  3, 4),
  ('Languages',          'SQL',         4, 5),
  ('Languages',          'VB.Net',      3, 6),
  ('Languages',          'ASP.NET',     3, 7),

  ('Backend',            'FastAPI',     5, 1),
  ('Backend',            'Flask',       4, 2),
  ('Backend',            'REST APIs',   5, 3),
  ('Backend',            'WebSockets',  4, 4),
  ('Backend',            'PyQt5',       4, 5),

  ('Frontend',           'React',       4, 1),
  ('Frontend',           'React Router',3, 2),
  ('Frontend',           'Tailwind CSS',3, 3),

  ('Data',               'MongoDB',     5, 1),
  ('Data',               'CockroachDB', 4, 2),
  ('Data',               'Cloudflare D1', 3, 3),
  ('Data',               'PostgreSQL',  3, 4),

  ('AI / GenAI',         'OpenAI GPT-4o',  5, 1),
  ('AI / GenAI',         'Gemini 2.5 Pro', 4, 2),
  ('AI / GenAI',         'Llama 3 (8B)',   4, 3),
  ('AI / GenAI',         'RAG architectures', 4, 4),
  ('AI / GenAI',         'Prompt engineering', 5, 5),

  ('Cloud & DevOps',     'AWS',          4, 1),
  ('Cloud & DevOps',     'Cloudflare Workers', 3, 2),
  ('Cloud & DevOps',     'Docker',       4, 3),
  ('Cloud & DevOps',     'Kubernetes',   3, 4),
  ('Cloud & DevOps',     'Jenkins',      4, 5),
  ('Cloud & DevOps',     'GitHub Actions',4, 6),
  ('Cloud & DevOps',     'Git',          5, 7),

  ('Monitoring',         'Grafana',      4, 1),
  ('Monitoring',         'Dynatrace',    4, 2),

  ('Testing & Automation','Selenium',    5, 1),
  ('Testing & Automation','PyTest',      4, 2),
  ('Testing & Automation','Slack Bots',  5, 3);

INSERT INTO education (institution, degree, location, start_date, end_date, details, sort_order) VALUES
  ('Kristu Jayanti College', 'Bachelor of Computer Applications (BCA)', 'Bangalore, India', '2019-06', '2022-06', 'Coursework: Data Structures, DBMS, Computer Networks, Operating Systems, Web Development.', 1);

INSERT INTO certifications (name, issuer, issued_date, sort_order) VALUES
  ('MongoDB SI Architect Certification', 'MongoDB',  '2024-09', 1),
  ('MongoDB SI Associate Certification', 'MongoDB',  '2024-08', 2),
  ('Generative AI Fluency',              'Udacity',  '2025-10', 3),
  ('Python: Master Programming',         'Udemy',    '2023-08', 4),
  ('Cloud Security Fundamentals — Cloud Application Security', 'Coursera', '2022-12', 5),
  ('AWS Academy Cloud Foundations',      'AWS Academy', '2021-08', 6);

INSERT INTO awards (title, issuer, date, description, sort_order) VALUES
  ('Accenture ACE Award', 'Accenture', '2023-07', 'Recognized for measurable impact on production reliability and engineer productivity through automation tooling.', 1);
