import moment from "moment-timezone";

export const parseTimeRange = (date: string, timeRange: string) => {
  const [start, end] = timeRange.split(" - ").map((t) => t.trim());

  const startMoment = moment.tz(
    `${date} ${start}`,
    "YYYY-MM-DD hh:mm A",
    "Asia/Kolkata",
  );

  const endMoment = moment.tz(
    `${date} ${end}`,
    "YYYY-MM-DD hh:mm A",
    "Asia/Kolkata",
  );

  if (!startMoment.isValid() || !endMoment.isValid()) {
    throw new Error("Invalid date or timeRange format");
  }

  const startTime = startMoment.utc().toDate();
  const endTime = endMoment.utc().toDate();

  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  return {
    startTime,
    endTime,
    duration,
  };
};
