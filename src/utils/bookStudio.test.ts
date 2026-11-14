import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPageToProject,
  applyStyleToAllPages,
  buildBookletImpositionSheets,
  buildBookProjectFromOrderItem,
  createBlankBookProject,
  deletePageFromProject,
  duplicatePageInProject,
  getOrderProjectKey,
  moveContentPage,
  padPagesForBooklet,
  parseBookProjectJson,
} from './bookStudio';
import type { AdminOrderRecord } from '../services/orders/ordersService';
import type { Story } from '../types/story';

const sampleOrder: AdminOrderRecord = {
  id: 'ord_123',
  orderNumber: 'MLS-261113-K9P2',
  customer: {
    fullName: 'أميرة بن علي',
    phone: '22123456',
    governorate: 'تونس',
    delegation: 'المرسى',
    address: 'نهج الحبيب بورقيبة 14',
    notes: '',
  },
  items: [
    {
      storyId: 'custom-freeform',
      storyTitle: 'مغامرة في المريخ',
      storyDomain: 'الخيال العلمي والفضاء',
      storyIdea: 'رحلة يوسف مع الروبوت ذكي لاستكشاف الكوكب الأحمر',
      childName: 'يوسف',
      childAge: 6,
      language: 'ar',
      dedication: 'إلى بطلنا يوسف، نحبك كثيراً',
      childPhotoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/TESTPHOTO',
      unitPrice: 69,
      quantity: 1,
    },
  ],
  subtotal: 69,
  deliveryFee: 7,
  total: 76,
  paymentMethod: 'COD',
  status: 'pending',
  confirmedAccurate: true,
  userId: null,
  createdAt: null,
};

const sampleStory: Story = {
  id: 'story-sci-fi',
  title: 'رائد الفضاء الصغير',
  slug: 'little-astronaut',
  description: 'قصة فضاء رائعة',
  category: 'خيال علمي',
  coverImage: '/src/assets/images/story_cover_sci_fi_cosmos_1794607446701.jpg',
  gallery: ['/src/assets/images/story_interior_spread_1794606420124.jpg'],
  price: 72,
  pages: 12,
  format: '21 × 25 cm',
  paperType: 'Mat',
  bindingType: 'Hard',
  ageRange: '4-9',
  language: ['ar'],
  featured: true,
  active: true,
};

test('buildBookProjectFromOrderItem pre-fills cover, dedication, child photo, storyIdea, and RTL', () => {
  const project = buildBookProjectFromOrderItem({
    order: sampleOrder,
    itemIndex: 0,
    story: sampleStory,
  });

  assert.equal(project.id, getOrderProjectKey('ord_123', 0));
  assert.equal(project.rtl, true);
  assert.equal(project.w, 210);
  assert.equal(project.h, 250);
  // 12 content pages + front cover + back cover = 14
  assert.equal(project.pages.length, 14);
  assert.ok(project.pages[0].text.includes('يوسف'));
  assert.equal(project.pages[0].showChildBadge, true);
  assert.equal(project.pages[1].text, 'إلى بطلنا يوسف، نحبك كثيراً');
  assert.equal(project.pages[1].img, sampleOrder.items[0].childPhotoBase64);
  assert.equal(project.pages[2].text, sampleOrder.items[0].storyIdea);
  assert.ok(project.pages[project.pages.length - 1].text.includes('MLS-261113-K9P2'));
});

test('padPagesForBooklet and buildBookletImpositionSheets compute exact saddle-stitch pairs', () => {
  const proj = createBlankBookProject({ contentPagesCount: 4, rtl: true });
  // 4 content + 2 covers = 6 pages -> padded to 8
  const padded = padPagesForBooklet(proj.pages);
  assert.equal(padded.length, 8);
  // Back cover stays at the very end
  assert.equal(padded[padded.length - 1]?.id, proj.pages[proj.pages.length - 1].id);
  // Blank pads inserted before back cover
  assert.equal(padded[5], null);
  assert.equal(padded[6], null);

  const rtlSheets = buildBookletImpositionSheets(padded.length, true);
  assert.equal(rtlSheets.length, 2);
  // Sheet 1 RTL front: [0, 7], back: [6, 1]
  assert.deepEqual(rtlSheets[0].front, [0, 7]);
  assert.deepEqual(rtlSheets[0].back, [6, 1]);

  const ltrSheets = buildBookletImpositionSheets(padded.length, false);
  assert.deepEqual(ltrSheets[0].front, [7, 0]);
  assert.deepEqual(ltrSheets[0].back, [1, 6]);
});

test('page add, duplicate, move, delete, and applyStyleToAllPages preserve covers safely', () => {
  let proj = createBlankBookProject({ contentPagesCount: 2, rtl: true });
  assert.equal(proj.pages.length, 4);

  // Add page after index 1
  const added = addPageToProject(proj, 1);
  proj = added.project;
  assert.equal(proj.pages.length, 5);
  assert.equal(added.nextIndex, 2);

  // Duplicate page 1
  const dup = duplicatePageInProject(proj, 1);
  proj = dup.project;
  assert.equal(proj.pages.length, 6);

  // Covers cannot be deleted
  const delCover = deletePageFromProject(proj, 0);
  assert.equal(delCover.project.pages.length, 6);

  // Move content page
  proj.pages[1].text = 'الصفحة الأولى';
  const moved = moveContentPage(proj, 1, 1);
  assert.equal(moved.project.pages[2].text, 'الصفحة الأولى');
  assert.equal(moved.nextIndex, 2);

  // Apply style to content pages only without overwriting cover style
  proj = moved.project;
  const coverFont = proj.pages[0].font;
  proj.pages[1].font = 'Amiri';
  proj.pages[1].color = '#123456';
  const styled = applyStyleToAllPages(proj, 1, 'content');
  assert.equal(styled.pages[0].font, coverFont);
  assert.equal(styled.pages[2].font, 'Amiri');
  assert.equal(styled.pages[2].color, '#123456');
});

test('parseBookProjectJson validates and sanitizes imported project JSON', () => {
  const proj = createBlankBookProject({ title: 'حكايتي', contentPagesCount: 3 });
  const serialized = JSON.stringify(proj);
  const restored = parseBookProjectJson(serialized);
  assert.ok(restored);
  assert.equal(restored?.title, 'حكايتي');
  assert.equal(restored?.pages.length, 5);

  assert.equal(parseBookProjectJson('invalid-json'), null);
  assert.equal(parseBookProjectJson('{"pages":[{}]}'), null);
});
