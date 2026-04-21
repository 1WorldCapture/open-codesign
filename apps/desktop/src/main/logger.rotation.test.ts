import { describe, expect, it, vi } from 'vitest';
import { rotateLogFile } from './logger';

describe('rotateLogFile', () => {
  it('shifts main.log -> main.old.log when no old exists', () => {
    const fs = {
      existsSync: vi.fn((p: string) => p.endsWith('main.log')),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.renameSync).toHaveBeenCalledWith('/tmp/logs/main.log', '/tmp/logs/main.old.log');
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('shifts both slots when main.log and main.old.log exist', () => {
    const exists = new Set(['/tmp/logs/main.log', '/tmp/logs/main.old.log']);
    const fs = {
      existsSync: vi.fn((p: string) => exists.has(p)),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.renameSync).toHaveBeenNthCalledWith(
      1,
      '/tmp/logs/main.old.log',
      '/tmp/logs/main.old.1.log',
    );
    expect(fs.renameSync).toHaveBeenNthCalledWith(
      2,
      '/tmp/logs/main.log',
      '/tmp/logs/main.old.log',
    );
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('drops oldest when all three slots exist', () => {
    const exists = new Set([
      '/tmp/logs/main.log',
      '/tmp/logs/main.old.log',
      '/tmp/logs/main.old.1.log',
    ]);
    const fs = {
      existsSync: vi.fn((p: string) => exists.has(p)),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/logs/main.old.1.log');
    expect(fs.renameSync).toHaveBeenCalledTimes(2);
  });

  it('is a no-op when the active file does not yet exist', () => {
    const fs = {
      existsSync: vi.fn(() => false),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(),
    };
    rotateLogFile('/tmp/logs/main.log', fs);
    expect(fs.renameSync).not.toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('reports rename failure via onError and still attempts remaining steps', () => {
    const fs = {
      existsSync: vi.fn(() => true),
      renameSync: vi.fn((_a: string, _b: string) => {
        throw new Error('EBUSY: resource busy or locked');
      }),
      unlinkSync: vi.fn(),
    };
    const errors: Array<{ step: string; message: string }> = [];
    const onError = (step: string, err: unknown) => {
      errors.push({ step, message: err instanceof Error ? err.message : String(err) });
    };
    expect(() => rotateLogFile('/tmp/logs/main.log', fs, onError)).not.toThrow();
    expect(errors.map((e) => e.step)).toEqual(['rename_old_to_oldest', 'rename_active_to_old']);
    expect(errors[0]?.message).toContain('EBUSY');
    expect(fs.renameSync).toHaveBeenCalledTimes(2);
  });

  it('continues when unlinkSync throws on the oldest slot', () => {
    const fs = {
      existsSync: vi.fn(() => true),
      renameSync: vi.fn(),
      unlinkSync: vi.fn(() => {
        throw new Error('EPERM');
      }),
    };
    const errors: Array<{ step: string; message: string }> = [];
    const onError = (step: string, err: unknown) => {
      errors.push({ step, message: err instanceof Error ? err.message : String(err) });
    };
    rotateLogFile('/tmp/logs/main.log', fs, onError);
    expect(errors[0]?.step).toBe('unlink_oldest');
    expect(fs.renameSync).toHaveBeenCalledTimes(2);
  });
});
