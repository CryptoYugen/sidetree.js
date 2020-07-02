import MockOperationQueue from '../../mocks/MockOperationQueue';

/**
 * Some documentation
 */
export default class MongoDbOperationQueue extends MockOperationQueue {
  public constructor(private connectionString: string) {
    super();

    console.debug('Making typescript ', this.connectionString);
  }

  /**
   * Initialize.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public initialize() {}

  async enqueue(didUniqueSuffix: string, operationBuffer: Buffer) {
    throw new Error(
      `MongoDbOperationQueue: Not implemented. Version: TestVersion1. Inputs: ${didUniqueSuffix}, ${operationBuffer}`
    );
  }
}
