-- Sample courses so the site is never empty on first deploy.
-- Delete these from /admin once you publish real ones.

INSERT OR REPLACE INTO courses
  (slug, title, summary, description, category, level, mode, duration, schedule,
   price_label, start_label, seats_label, image_url, highlights, curriculum, tags,
   register_url, published, featured, sort_order)
VALUES
(
 'full-stack-web-development',
 'Full Stack Web Development',
 'Go from HTML to a deployed, production-grade web app you can put on your resume.',
 'A build-first program that takes you from the fundamentals of the web all the way to shipping a real application on live infrastructure.

You will not sit through passive tutorials. Every module ends with something you have actually deployed, reviewed and can demo. By the final week you will have a portfolio project, a clean GitHub history and the vocabulary to talk about your own architecture in an interview.',
 'Web Development', 'Beginner to Advanced', 'Online (Live)', '12 weeks', 'Weekends, 7:00 PM - 9:30 PM IST',
 'Free', 'Next cohort opens soon', 'Limited seats per cohort', '',
 '["Live mentor-led sessions, not recordings","One portfolio project reviewed line by line","Deployment on real infrastructure","Interview preparation and mock rounds","Certificate on completion"]',
 '[{"title":"Foundations of the Web","detail":"HTML, CSS, responsive layout, accessibility and the browser rendering model."},{"title":"JavaScript in Depth","detail":"The language, the DOM, async patterns, fetch and modern tooling."},{"title":"Frontend with React","detail":"Components, state, routing, forms and data fetching patterns."},{"title":"Backend and APIs","detail":"HTTP, REST design, authentication, validation and error handling."},{"title":"Databases","detail":"Relational modelling, SQL, migrations and query performance."},{"title":"Ship It","detail":"CI, environments, monitoring and deploying your capstone to production."}]',
 '["HTML","CSS","JavaScript","React","Node.js","SQL"]',
 'https://forms.gle/REPLACE_WITH_YOUR_FORM',
 1, 1, 10
),
(
 'python-for-data-science',
 'Python for Data Science',
 'Learn the analysis workflow that data teams actually use, on real messy datasets.',
 'Most data courses hand you a clean CSV and call it analysis. This one does not.

You will work with the kind of incomplete, inconsistent data that shows up in real organisations, and learn the judgment calls that turn it into a defensible conclusion. Every module produces a notebook you could hand to a stakeholder.',
 'Data Science', 'Beginner', 'Online (Live)', '8 weeks', 'Tue and Thu, 8:00 PM - 9:30 PM IST',
 'Free', 'Next cohort opens soon', 'Limited seats per cohort', '',
 '["Real datasets, not toy examples","Notebook portfolio you can share","Statistics explained without the jargon","Weekly feedback on your work","Certificate on completion"]',
 '[{"title":"Python Essentials","detail":"Syntax, data structures and writing code you can read again next month."},{"title":"NumPy and Pandas","detail":"Vectorised thinking, indexing, joins, grouping and reshaping."},{"title":"Cleaning Real Data","detail":"Missing values, outliers, encodings and the decisions behind each fix."},{"title":"Visual Analysis","detail":"Choosing the right chart and making it readable for a non-technical reader."},{"title":"Statistics That Matter","detail":"Distributions, correlation, significance and how to avoid fooling yourself."},{"title":"Capstone Analysis","detail":"An end-to-end investigation you present and defend."}]',
 '["Python","Pandas","NumPy","Matplotlib","Statistics"]',
 'https://forms.gle/REPLACE_WITH_YOUR_FORM',
 1, 1, 20
),
(
 'ui-ux-design-fundamentals',
 'UI/UX Design Fundamentals',
 'Design interfaces people can actually use, and learn to explain why they work.',
 'Design is not decoration. This program teaches the reasoning underneath a good interface: hierarchy, affordance, contrast, rhythm and the constraints of a real screen.

You will finish with a case study portfolio, which is what design hiring managers ask for.',
 'Design', 'Beginner', 'Online (Live)', '6 weeks', 'Sat and Sun, 11:00 AM - 1:00 PM IST',
 'Free', 'Next cohort opens soon', 'Limited seats per cohort', '',
 '["Figma from zero to confident","Three case studies for your portfolio","Critique sessions on your own work","Handoff practice with developers","Certificate on completion"]',
 '[{"title":"Design Foundations","detail":"Layout, spacing, typography and colour that survives contact with real content."},{"title":"Figma Workflow","detail":"Frames, auto layout, components, variants and design tokens."},{"title":"User Research","detail":"Interviews, journey maps and turning findings into decisions."},{"title":"Interaction Design","detail":"States, feedback, motion and designing the unhappy path."},{"title":"Accessibility","detail":"Contrast, focus order, touch targets and designing for assistive tech."},{"title":"Portfolio Case Study","detail":"Packaging your process into a story that gets you interviews."}]',
 '["Figma","Design Systems","Prototyping","Accessibility"]',
 'https://forms.gle/REPLACE_WITH_YOUR_FORM',
 1, 0, 30
);
