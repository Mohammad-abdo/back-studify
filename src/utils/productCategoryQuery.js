/**
 * Category branch resolution without DB parent column.
 * Convention: sub-categories are named "MainName / SubName" (space-slash-space).
 * Same isInstituteCategory as root — keeps government catalogue separate from retail.
 */

const CATEGORY_PATH_SEP = ' / ';

/**
 * All category ids that belong to the same "branch" as root (root + descendants named root + " / ...").
 */
async function getCategoryIdsIncludingDescendants(prisma, rootId) {
  const root = await prisma.productCategory.findUnique({
    where: { id: rootId },
    select: { id: true, name: true, isInstituteCategory: true },
  });
  if (!root) {
    return [];
  }

  const descendants = await prisma.productCategory.findMany({
    where: {
      isInstituteCategory: root.isInstituteCategory,
      name: { startsWith: root.name + CATEGORY_PATH_SEP },
    },
    select: { id: true },
  });

  return [root.id, ...descendants.map((d) => d.id)];
}

function categoryPathSeparator() {
  return CATEGORY_PATH_SEP;
}

/**
 * True if `name` is a direct child of `parentName` (one path segment after parent).
 */
function isDirectChildCategoryName(parentName, candidateName) {
  if (!candidateName.startsWith(parentName + CATEGORY_PATH_SEP)) {
    return false;
  }
  const rest = candidateName.slice((parentName + CATEGORY_PATH_SEP).length);
  return rest.length > 0 && !rest.includes(CATEGORY_PATH_SEP);
}

/**
 * True if `category` is not a direct child of any other row in `list` (same isInstituteCategory).
 */
function isRootCategoryAmong(category, list) {
  return !list.some(
    (p) =>
      p.id !== category.id &&
      p.isInstituteCategory === category.isInstituteCategory &&
      isDirectChildCategoryName(p.name, category.name)
  );
}

module.exports = {
  getCategoryIdsIncludingDescendants,
  categoryPathSeparator,
  isDirectChildCategoryName,
  isRootCategoryAmong,
};
