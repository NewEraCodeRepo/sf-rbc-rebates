# RBC Rebate Management

Rebate Management is responsible for instructing RBC when it believes a customer should receive a rebate.

Imagine a customer is eligible for a 50% discount at a particular store.

Rebate Management learns about offer details via a Kafka topic:

ID      |Description | Reward Formula
--------|------------|---------------
Offer 1 | 50% off    | `amount * 0.5`

(These tables are just examples to illustrate the story. The real data is more complicated.)

Periodically, it receives notices of transactions:

ID            | Customer | Purchase | Amount | Offer ID
--------------|----------|----------|--------|---------
Transaction 1 | Ava      | M&M's    | $2     | Offer 1

It's Rebate Management's responsibility to determine that Ava is eligible for a rebate. When it does, it notifies RBC that the Ava is owed a rebate:

Customer  | Status | Amount | Transaction ID | Offer ID
----------|--------|--------|----------------|---------
| Ava     | refund | $1     | Transaction 1  | Offer 1

RBC _independently_ double-checks the rebate and pays Ava $1. It then sends out a notice of fulfillment to let Rebate Management know that the rebate has been fulfilled.

## Installing it for the first time

You might have run into some issues building node-rdkafka if you have never build it before. Here's an example of a problem you might run into:  You need to export the following environment variables before node-rdkafka will build successfully on your platform:

    export CPPFLAGS=-I/usr/local/opt/openssl/include 
    export LDFLAGS=-L/usr/local/opt/openssl/lib

Or if you are like me and don't want to have too many mysterious environment variables sitting around forever, you can run the following command to build the project:

    CPPFLAGS=-I/usr/local/opt/openssl/include LDFLAGS=-L/usr/local/opt/openssl/lib yarn install

## Running via Command Line

In production environments, the RM application will be run as a scheduled process using the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) via a CLI command. The harness code around these live in the /app/scheduler repo. Be sure to run bin/build before attempting to run the following command:

    node build/app/scheduler

**NOTE**: **WEB_CONCURRENCY** environment variable determines the number of worker processes to spin up at a single time.

This will:
    1. Start up a "master" process
    2. Spin up WEB_CONCURRENCY number of "worker" processes
    3. Master process will mark all non-processed messages for a specific processor based on the user_id associated to the transaction
    4. Each worker process will then fetch the list of transactions assigned to them and run transaction processing on each of them sequentially
    5. Master polls running count of unprocessed messages, waiting for all to be processed
    6. When each worker is done, they will exit, and master sees all transactions have been processed
    7. Master exports the generated rebates to MC
    8. Master syncs the running totals for each offer to MOP
    9. Process exits

The major steps (Process transactions, Export to MC, Sync to MOP) all have specfic commands that can be run to just perform these commands without the full master-worker process around it:

    node build/app/scheduler/boot --type TRANSACTION_PROCESSING
    node build/app/scheduler/boot --type MC_EXPORT
    node build/app/scheduler/boot --type MOP_SYNC

## Scheduled Processes:

### Monthly Table Partition Creation

On a monthly basis, partitioned tables need to be created for the user history ledgers:
 
    node build/app/scheduler/create_partitions.js

TODO: ADD MORE DETAIL AROUND OTHER MAJOR PROCESSES

## Developing

To set up your environment, run:

    bin/setup

Follow any instructions, and re-run until you see “You're good to go!”.

To start a local development server, watching for changes:

    bin/start --watch

To start specific processes from the `Procfile`:

    bin/start firehose

To run tests, watching for changes:

    bin/test --watch
    
**For slow tests, ie. kafka:**

Add tags to your tests:

    it("does something that takes a long time @slow", async () => {
        await sleep(20);
    });

Use --except or --only to filter on the tag:

    bin/test --except @slow # or
    bin/test --only @slow

    ALSO

    bin/test --except @kafka # or
    bin/test --only @kafka

To view your environment's settings, run:

    bin/env

### Selectively running processes

You can run certain processes by passing additional arguments to `bin/start`:

    bin/start              # start everything
    bin/start web --watch  # start only the web process, restarting when changes are detected
    bin/start firehose web # start only the firehose and web processes

### Logging database queries

If you’re trying to debug database queries, there is a `DATABASE_LOGGING` environment variable, which can be run like this:

    DATABASE_LOGGING=all bin/test --watch
    DATABASE_LOGGING=all bin/start web

## Database

The RM app requires Postgres version 10.2 or greater.

To run migrations:

    bin/dbmigrate

To create a new migration:

    bin/dbmigrate create add-blaster-doors

To create a migration for the Heroku Connect/Salesforce database:

    bin/dbmigrate create-salesforce add-heroku-connect-table

To create a migration for the History database:

    bin/dbmigrate create-history add-user-history-information

## Heroku Setup

TODO: Add more detail below

### Connecting to Heroku Connect via attach to ETL app

The RM application requires a connection to the ETL app's Heroku Connect database in order to write report records and update running count of offer redemptions. In order to do this, the HC database from ETL needs to be [attached] (https://devcenter.heroku.com/articles/managing-add-ons#using-the-command-line-interface-attaching-an-add-on-to-another-app). 

After the database is attached, the ATTACHED_DB_URL_NAME environment variable will need to be added and updated in Heroku to the name of the env variable that Heroku assigns it (for example `ATTACHED_DB_URL_NAME=HEROKU_POSTGRESQL_MAROON_URL` ).

## Application layout

```
app
├── database
│   ├── history_records      # (temp directory until history service is created) Entities stored in the history schema
│   ├── records              # Entities stored in the database
│   ├── repositories         # Where to query for repositories
│   ├── salesforce_records   # Entities stored in the salesforce schema
│   └── serializers          # Responsible for translating a record into a model
├── exports                  # Exports rebate data to MC
├── kafka                    # Consumes and publishes kafka events
├── models                   # TypeScript interfaces that correspond with db records
├── offer_import             # Imports offers from Salesforce
├── scheduler                # Harness around running RM from command-line
├── transaction_import       # Imports transactions from MC
├── transaction_processing   # Processes transactions and creates rebates
└── web                      # Web UI (for demo and testing purposes)
bin                          # Executable scripts (e.g. bin/setup, bin/start)
config                       # Application configuration
db
└── migrations               # Steps to migrate the database forwards or backwards
lib                          # Application-agnostic library code
test
├── fixtures                 # Test fixture files (JSON payloads, CSVs, etc.)
├── integration              # Full-stack tests
└── support                  # Files for supporting test
```

## File conventions

### Kafka event payloads

- Any kafka event payloads and their dependencies should reside in [datapipeline-schemas/src/rebateManagementObject.ts](https://github.com/SalesforceCloudServices/datapipeline-schemas/src/rebateManagementObject.ts) file.
- All interface, kafka payload interface and shared model / model classes should begin with an **I**

Once in [datapipeline-schemas](https://github.com/SalesforceCloudServices/datapipeline-schemas) they can be imported like this:

`import { ITransactionForRebateCriteria } from "datapipeline-schemas/rebateManagementObject";`

You can also import multiple modules like this:

`import { ITransactionForRebateCriteria, IRebatePayload } from "datapipeline-schemas/rebateManagementObject";`

### Other application specific interfaces, models and types

- Application specific interfaces and types (enums) should go in the `app/interfaces` directory.
- Application specific models should go in the `app/models` directory.
- Interface and model classes **should start with an I**
- Type / enum classes **do not need to start with an I**
