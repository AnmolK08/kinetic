import { EventEmitter } from 'events';

class RoutineQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = [];
    this.isProcessing = false;
  }

  /**
   * Enqueue a background job
   */
  async add(jobType, data) {
    const job = {
      id: `${jobType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: jobType,
      data,
      createdAt: new Date(),
    };

    this.jobs.push(job);
    this.emit('jobAdded', job);
    this.processNext();
    return job;
  }

  async processNext() {
    if (this.isProcessing || this.jobs.length === 0) return;
    this.isProcessing = true;

    const job = this.jobs.shift();
    try {
      this.emit('process', job);
    } catch (err) {
      console.error(`[QUEUE] Error processing job ${job.id}:`, err);
    } finally {
      this.isProcessing = false;
      if (this.jobs.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }
}

export const routineQueue = new RoutineQueue();
export default routineQueue;
