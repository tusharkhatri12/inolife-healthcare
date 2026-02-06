/**
 * Pagination helper utilities
 */

/**
 * Parse pagination parameters from query string
 * @param {Object} query - Express request query object
 * @returns {Object} - { page, limit, skip }
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10)); // Max 100 per page
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format pagination response
 * @param {Object} options - { data, total, page, limit }
 * @returns {Object} - Formatted pagination response
 */
const formatPaginationResponse = ({ data, total, page, limit }) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    },
    data,
  };
};

module.exports = {
  parsePagination,
  formatPaginationResponse,
};
