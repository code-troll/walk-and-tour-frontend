export const formatAdminDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "long" },
) =>
  new Intl.DateTimeFormat("en-GB", options).format(new Date(value));
