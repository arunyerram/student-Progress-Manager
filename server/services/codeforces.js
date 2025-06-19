
// server/services/codeforces.js
const axios = require('axios');

/**
 * Returns a Set of solved problem keys (format: "contestId-index")
 */
async function fetchUserSolvedProblems(handle) {
  try {
    const { data } = await axios.get(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=100000`
    );
    if (data.status !== 'OK') throw new Error(data.comment);
    const solved = new Set();
    for (const sub of data.result) {
      if (sub.verdict === 'OK' && sub.problem && sub.problem.contestId && sub.problem.index) {
        solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    }
    return solved;
  } catch (e) {
    console.warn(`⚠️  Failed to fetch solved problems for "${handle}":`, e.message);
    return new Set();
  }
}

/**
 * Fetches problems for a given contest
 * Returns array of { contestId, index }
 */
async function fetchContestProblems(contestId) {
  try {
    const { data } = await axios.get(
      `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`
    );
    if (data.status !== 'OK') throw new Error(data.comment);
    return data.result.problems.map(p => ({
      contestId,
      index: p.index,
      name: p.name,
    }));
  } catch (e) {
    console.warn(`⚠️  Failed to fetch contest problems for contest ${contestId}:`, e.message);
    return [];
  }
}

/**
 * Returns contest history with problemsUnsolved for each contest
 */
async function fetchContestHistory(handle) {
  try {
    // 1. Get contest participations
    const { data } = await axios.get(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`
    );
    if (data.status !== 'OK') throw new Error(data.comment);
    const contestList = data.result.map(c => ({
      contestId:    c.contestId,
      name:         c.contestName,
      date:         new Date(c.ratingUpdateTimeSeconds * 1000),
      rank:         c.rank,
      ratingBefore: c.oldRating,
      ratingAfter:  c.newRating,
      problemsUnsolved: 0, // will fill below
    }));

    // 2. Fetch all solved problems
    const solvedSet = await fetchUserSolvedProblems(handle);

    // 3. For each contest, count unsolved
    for (let i = 0; i < contestList.length; i++) {
      const c = contestList[i];
      const contestProblems = await fetchContestProblems(c.contestId);
      let unsolved = 0;
      for (const prob of contestProblems) {
        if (!solvedSet.has(`${c.contestId}-${prob.index}`)) unsolved++;
      }
      c.problemsUnsolved = unsolved;
    }

    return contestList;
  } catch (e) {
    console.warn(`⚠️  skipping contests fetch for "${handle}":`, e.message);
    return [];
  }
}

/**
 * Fetches solved problems with metadata
 */
async function fetchProblemStats(handle) {
  try {
    const { data } = await axios.get(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`
    );
    if (data.status !== 'OK') throw new Error(data.comment);
    return data.result
      .filter(sub => sub.verdict === 'OK')
      .map(sub => ({
        problemId: `${sub.problem.contestId}${sub.problem.index}`,
        solvedAt:  new Date(sub.creationTimeSeconds * 1000),
        rating:    sub.problem.rating || 0
      }));
  } catch (e) {
    console.warn(`⚠️  skipping problemStats fetch for "${handle}":`, e.message);
    return [];
  }
}

module.exports = { fetchContestHistory, fetchProblemStats };
