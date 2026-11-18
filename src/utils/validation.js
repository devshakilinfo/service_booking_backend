const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BOOKING_DAYS_AHEAD = 60;

const todayUtc = () => new Date().toISOString().split('T')[0];

const validateBookingDate = (date) => {
  if (typeof date !== 'string' || !DATE_REGEX.test(date)) {
    return 'Date must be in YYYY-MM-DD format';
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().split('T')[0] !== date) {
    return 'Date is not a valid calendar date';
  }

  if (date < todayUtc()) {
    return 'Cannot book a date in the past';
  }

  const maxDate = new Date();
  maxDate.setUTCDate(maxDate.getUTCDate() + MAX_BOOKING_DAYS_AHEAD);
  if (parsed > maxDate) {
    return `Bookings can be made at most ${MAX_BOOKING_DAYS_AHEAD} days in advance`;
  }

  return null;
};

module.exports = { validateBookingDate, DATE_REGEX };
