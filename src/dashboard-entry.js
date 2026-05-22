// MUST import synthetic shadow BEFORE any LWC imports.
import '@lwc/synthetic-shadow';

// Load dashboard bootstrap only after synthetic shadow patches runtime globals.
await import('./dashboard-bootstrap.js');
