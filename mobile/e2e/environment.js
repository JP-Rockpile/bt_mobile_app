const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Can be used to add custom setup
    this.initTimeout = 300000;
  }

  async setup() {
    await super.setup();
    // Additional setup if needed
  }

  async teardown() {
    await super.teardown();
    // Additional teardown if needed
  }
}

module.exports = CustomDetoxEnvironment;