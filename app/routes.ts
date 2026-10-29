import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("layouts/public.tsx", [
    index("routes/home.tsx"),
    route("about", "routes/about.tsx"),
    route("experience", "routes/experience.tsx"),
    route("projects", "routes/projects.tsx"),
    route("projects/:slug", "routes/project.$slug.tsx"),
    route("skills", "routes/skills.tsx"),
    route("resume", "routes/resume.tsx"),
    route("contact", "routes/contact.tsx"),
  ]),
  route("resume.docx", "routes/resume-docx.tsx"),
  route("cover-letter.docx", "routes/cover-letter-docx.tsx"),
  route("admin/login", "routes/admin.login.tsx"),
  route("admin/logout", "routes/admin.logout.tsx"),
  layout("layouts/admin.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/profile", "routes/admin.profile.tsx"),
    route("admin/experience", "routes/admin.experience.tsx"),
    route("admin/projects", "routes/admin.projects.tsx"),
    route("admin/skills", "routes/admin.skills.tsx"),
    route("admin/certifications", "routes/admin.certifications.tsx"),
    route("admin/resume", "routes/admin.resume.tsx"),
    route("admin/resume/tailored", "routes/admin.resume.tailored.tsx"),
    route("admin/resume/tailored/new", "routes/admin.resume.tailored.new.tsx"),
    route("admin/resume/tailored/:id", "routes/admin.resume.tailored.$id.tsx"),
    route("admin/messages", "routes/admin.messages.tsx"),
  ]),
] satisfies RouteConfig;
