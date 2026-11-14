import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageMeta,
  getImageSize,
  validateFirestoreDocumentSize,
  MAX_ORIGINAL_IMAGE_BYTES,
} from './ImageService';

test('validateImageMeta allows valid JPEG/PNG/WEBP under 5MB and rejects invalid files', () => {
  assert.deepEqual(validateImageMeta({ type: 'image/jpeg', size: 500_000 }), { valid: true });
  assert.deepEqual(validateImageMeta({ type: 'image/png', size: 1_000_000 }), { valid: true });
  assert.deepEqual(validateImageMeta({ type: 'image/webp', size: 2_000_000 }), { valid: true });

  assert.deepEqual(validateImageMeta({ type: 'image/gif', size: 50_000 }), {
    valid: false,
    errorCode: 'invalid_type',
  });
  assert.deepEqual(
    validateImageMeta({ type: 'image/jpeg', size: MAX_ORIGINAL_IMAGE_BYTES + 1 }),
    {
      valid: false,
      errorCode: 'file_too_large',
    }
  );
  assert.deepEqual(validateImageMeta({ type: 'image/png', size: 0 }), {
    valid: false,
    errorCode: 'empty_file',
  });
});

test('getImageSize and validateFirestoreDocumentSize enforce Firestore safe ceiling', () => {
  const sample = 'data:image/jpeg;base64,AAAA';
  assert.equal(getImageSize(sample), 27);

  const smallOrder = { orderNumber: 'MLS-261113-ABCD', items: [{ childPhotoBase64: sample }] };
  assert.equal(validateFirestoreDocumentSize(smallOrder).valid, true);

  const hugeOrder = {
    orderNumber: 'MLS-261113-ABCD',
    items: [{ childPhotoBase64: 'A'.repeat(900_000) }],
  };
  assert.equal(validateFirestoreDocumentSize(hugeOrder).valid, false);
});
