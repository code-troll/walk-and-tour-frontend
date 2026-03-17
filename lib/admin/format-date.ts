export const formatAdminDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) =>
  new Intl.DateTimeFormat("en-GB", options).format(new Date(value));
