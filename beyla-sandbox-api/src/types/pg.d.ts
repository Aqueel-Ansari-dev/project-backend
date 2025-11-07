declare module 'pg' {
  export interface QueryResult<R = any> {
    rows: R[];
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: any;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<R = any>(query: string, values?: any[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
    release?(): void;
  }

  export interface PoolClient {
    query<R = any>(query: string, values?: any[]): Promise<QueryResult<R>>;
    release?(): void;
  }

  export const types: {
    setTypeParser: (oid: number, parser: (value: string) => any) => void;
  };
}
