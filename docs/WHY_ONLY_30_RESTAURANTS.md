# Why Am I Only Seeing 30 Restaurants?

## ✅ Confirmed: All 65 Restaurants Are in Database

- **Total restaurants**: 65
- **All are active**: ✅
- **All are in the view**: ✅
- **API is working**: ✅ (diagnostic confirmed)

## 🔍 Why You Might See Only 30

### 1. **Pagination** (Most Likely)
The restaurants page shows **20 per page** by default. If you see "30 restaurants found", you're probably:
- On page 1 (showing first 20)
- On page 2 (showing next 20)
- Total count shows 30, but you need to navigate pages

**Fix**: Scroll down or click "Next" to see more pages.

### 2. **City Filter Applied**
If you're on a page with `?city=Houston` or similar:
- Only restaurants in that city will show
- 52 restaurants are in Houston
- 13 are in other cities (Falls Church, Syracuse, Mechanicsburg, etc.)

**Fix**: Remove the city filter from the URL or clear filters.

### 3. **Other Filters**
Check if any filters are active:
- Cuisine type filter
- Price range filter
- Minimum rating filter

**Fix**: Clear all filters to see all restaurants.

### 4. **Cached Data**
Your browser might be showing old cached data.

**Fix**: 
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try incognito/private mode

## 🧪 How to Verify

### Test 1: Check the API Directly
Visit: `https://your-site.vercel.app/api/restaurants/search`

Should return JSON with `total: 65` (or close to it if filters are applied).

### Test 2: Check Without Filters
Visit: `https://your-site.vercel.app/restaurants` (no query parameters)

Should show all restaurants without any filters.

### Test 3: Check Total Count
On the restaurants page, look for text like:
- "65 restaurants found" (if no filters)
- "30 restaurants found" (if filters are applied)

## 📊 Current Breakdown

- **Old restaurants** (before 1/26): 16
- **New restaurants** (1/26 or later): 49
- **In Houston**: 52
- **In other cities**: 13

## 🎯 Quick Fixes

1. **Visit**: `/restaurants` (no filters)
2. **Clear all filters** on the page
3. **Check pagination** - click through pages
4. **Hard refresh** your browser

## 💡 If Still Only 30

If you're absolutely sure you're seeing only 30 with no filters:

1. Check browser console for errors
2. Check the network tab - see what the API actually returns
3. Visit `/api/restaurants/search` directly to see the raw data
4. Check if there's a default filter being applied somewhere

The database has all 65, so if you're only seeing 30, it's a frontend filter or pagination issue.
