import { VisaHttpClient } from './client.js';
import { log } from './utils.js';

export class Bot {
  constructor(config, options = {}) {
    this.config = config;
    this.dryRun = options.dryRun || false;
    this.client = new VisaHttpClient(this.config.countryCode, this.config.email, this.config.password);
  }

  async initialize() {
    log('Initializing visa bot...');
    return await this.client.login();
  }

  async checkAvailableDate(sessionHeaders, currentBookedDate, minDate) {
    const dates = await this.client.checkAvailableDate(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId
    );

    if (!dates || dates.length === 0) {
      log("no dates available");
      return null;
    }

    // Filter dates that are better than current booked date and after minimum date
    const goodDates = dates.filter(date => {
      if (date >= currentBookedDate) {
        log(`date ${date} is further than already booked (${currentBookedDate})`);
        return false;
      }

      if (minDate && date < minDate) {
        log(`date ${date} is before minimum date (${minDate})`);
        return false;
      }

      return true;
    });

    if (goodDates.length === 0) {
      log("no good dates found after filtering");
      return null;
    }

    // Sort dates and return the earliest one
    goodDates.sort();
    const earliestDate = goodDates[0];
    
    log(`found ${goodDates.length} good dates: ${goodDates.join(', ')}, using earliest: ${earliestDate}`);
    return earliestDate;
  }

  async bookAppointment(sessionHeaders, date) {
    // Check consulate appointment time
    const time = await this.client.checkAvailableTime(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId,
      date
    );

    if (!time) {
      log(`no available time slots for date ${date}`);
      return false;
    }

    // If ASC facility is specified, check ASC appointment availability
    let dateAsc = '';
    let timeAsc = '';
    
    if (this.config.facilityIdAsc) {
      log('Checking ASC appointment availability...');
      const ascDates = await this.client.checkAvailableDate(
        sessionHeaders,
        this.config.scheduleId,
        this.config.facilityIdAsc
      );

      if (ascDates && ascDates.length > 0) {
        // Get the first available ASC date
        dateAsc = ascDates[0];
        timeAsc = await this.client.checkAvailableTime(
          sessionHeaders,
          this.config.scheduleId,
          this.config.facilityIdAsc,
          dateAsc
        );

        if (!timeAsc) {
          log(`No available ASC time slots for date ${dateAsc}`);
          return false;
        }
        log(`Found ASC appointment slot: ${dateAsc} ${timeAsc}`);
      } else {
        log('No ASC dates available');
        return false;
      }
    }

    if (this.dryRun) {
      log(`[DRY RUN] Would book consulate appointment at ${date} ${time}`);
      if (this.config.facilityIdAsc) {
        log(`[DRY RUN] Would book ASC appointment at ${dateAsc} ${timeAsc}`);
      }
      return true;
    }

    await this.client.book(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId,
      date,
      time,
      this.config.facilityIdAsc,
      dateAsc,
      timeAsc
    );

    log(`Booked consulate appointment at ${date} ${time}`);
    if (this.config.facilityIdAsc) {
      log(`Booked ASC appointment at ${dateAsc} ${timeAsc}`);
    }
    return true;
  }

}
