const dateFormats = {
  short: new Intl.DateTimeFormat("en-US", {
    month: "short", year: "numeric", timeZone: "UTC",
  }),
  long: new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }),
};

export function formatWritingDate(date: string, style: keyof typeof dateFormats = "short") {
  return dateFormats[style].format(new Date(date));
}
