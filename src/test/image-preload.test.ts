import { afterEach, describe, expect, it, vi } from 'vitest';
class FakeImage {
 static created: FakeImage[]=[];
 onload: (()=>void|Promise<void>)|null=null;
 onerror: (()=>void)|null=null;
 naturalWidth=1600;
 src='';
 decode=vi.fn(async()=>undefined);
 constructor(){ FakeImage.created.push(this); }
}
afterEach(()=>{ vi.unstubAllGlobals(); FakeImage.created=[]; });
describe('decoded scene preloading',()=>{
 it('waits until loading and decoding finish before a scene may commit',async()=>{
  vi.stubGlobal('Image',FakeImage); const {preloadImage}=await import('../lib/image-preload');
  let done=false; const request=preloadImage('/slow-frame.jpg').then(()=>{done=true;});
  await Promise.resolve(); expect(done).toBe(false);
  const image=FakeImage.created[0]; if(!image)throw new Error('missing image');
  let finishDecode:(()=>void)|undefined;
  image.decode.mockImplementation(()=>new Promise<void>(resolve=>{finishDecode=resolve;}));
  const loading=image.onload?.(); await Promise.resolve(); expect(done).toBe(false);
  finishDecode?.(); await loading; await request; expect(done).toBe(true);
 });
 it('shares simultaneous requests and retains decoded images',async()=>{
  vi.stubGlobal('Image',FakeImage); const {preloadImage}=await import('../lib/image-preload');
  const first=preloadImage('/shared-frame.jpg'); const second=preloadImage('/shared-frame.jpg');
  expect(first).toBe(second); expect(FakeImage.created).toHaveLength(1);
  await FakeImage.created[0]?.onload?.(); await first;
  await preloadImage('/shared-frame.jpg'); expect(FakeImage.created).toHaveLength(1);
 });
 it('rejects a failed frame and allows a retry instead of poisoning the cache',async()=>{
  vi.stubGlobal('Image',FakeImage); const {preloadImage}=await import('../lib/image-preload');
  const failed=preloadImage('/retry-frame.jpg'); const rejection=expect(failed).rejects.toThrow();
  FakeImage.created[0]?.onerror?.(); await rejection;
  const retry=preloadImage('/retry-frame.jpg'); expect(FakeImage.created).toHaveLength(2);
  await FakeImage.created[1]?.onload?.(); await expect(retry).resolves.toBeUndefined();
 });
});
