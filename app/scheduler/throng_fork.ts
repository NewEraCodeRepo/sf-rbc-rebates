'use strict';

/*
  This is a fork of Throng: 
  https://github.com/hunterloftis/throng

  The only difference is that when a worker finishes, it doesn't get revived
*/

const cluster = require('cluster');
const EventEmitter = require('events').EventEmitter;
const defaults = require('lodash.defaults');
const cpuCount = require('os').cpus().length;

const DEFAULT_OPTIONS = {
  workers: cpuCount,
  lifetime: Infinity,
  grace: 5000
};

const NOOP = () => {};

export function throng(options?: any, startFunction?: any): any {
  options = options || {};
  let startFn = options.start || startFunction || options;
  let masterFn = options.master || NOOP;

  if (typeof startFn !== 'function') {
    throw new Error('Start function required');
  }
  if (cluster.isWorker) {
    return startFn(cluster.worker.id);
  }

  let opts = isNaN(options) ?
    defaults(options, DEFAULT_OPTIONS) : defaults({ workers: options }, DEFAULT_OPTIONS);
  let emitter = new EventEmitter();
  let running = true;
  let runUntil = Date.now() + opts.lifetime;

  listen();
  let workers = fork();
  masterFn(workers);

  function listen() {
    cluster.on('exit', () => { console.log("received shutdown signal..."); }); // Do not revive workers when they finish
    emitter.once('shutdown', shutdown);
    cluster.on('error', (error) => { console.log("ERROR in cluster: ", error ) });
    process
      .on('SIGINT', proxySignal)
      .on('SIGTERM', proxySignal);
  }

  function fork() {
    let workers: any[] = [];

    for (var i = 0; i < opts.workers; i++) {
      workers.push(cluster.fork());
    }

    return workers;
  }

  function proxySignal() {
    emitter.emit('shutdown');
  }

  function shutdown() {
    running = false;
    for (var id in cluster.workers) {
      cluster.workers[id].process.kill();
    }
    setTimeout(forceKill, opts.grace);
  }

  function revive(worker, code, signal) {
    if (running && Date.now() < runUntil) cluster.fork();
  }

  function forceKill() {
    for (var id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit();
  }
};