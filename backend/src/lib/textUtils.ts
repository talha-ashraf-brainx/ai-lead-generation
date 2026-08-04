export function firstName(contactName: string): string {
  return contactName.split(" ")[0] || contactName;
}

// Renders the {{firstName}}/{{company}} merge tags used in campaign follow-up templates
// (see frontend's DEFAULT_FOLLOW_UPS) against a specific lead.
export function renderTemplate(template: string, lead: { contactName: string; company: string }): string {
  return template.replaceAll("{{firstName}}", firstName(lead.contactName)).replaceAll("{{company}}", lead.company);
}
