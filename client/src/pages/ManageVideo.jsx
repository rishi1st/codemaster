import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router';
import { FiChevronLeft, FiTrash2 , FiSearch } from 'react-icons/fi';
import { RiVideoUploadLine } from "react-icons/ri";
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-toastify';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

const tagColors = {
  array: 'bg-blue-100 text-blue-800',
  string: 'bg-purple-100 text-purple-800',
  linkedList: 'bg-indigo-100 text-indigo-800',
  tree: 'bg-green-100 text-green-800',
  graph: 'bg-teal-100 text-teal-800',
  dp: 'bg-orange-100 text-orange-800',
  math: 'bg-pink-100 text-pink-800',
  recursion: 'bg-yellow-100 text-yellow-800',
  search: 'bg-red-100 text-red-800',
  sorting: 'bg-gray-100 text-gray-800'
};

const ManageVideo = () => {
  const [problems, setProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch problems
  const fetchProblems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosClient.get('/problem');
      setProblems(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      toast.error('Failed to load problems. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Delete problem
  const handleDelete = useCallback(async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem? This action cannot be undone.')) return;
    
    try {
      await axiosClient.delete(`/video/delete/${problemId}`);
      await fetchProblems();
      toast.success('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    }
  }, [fetchProblems]);
  
  // 

  // Filter problems
  const filteredProblems = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return problems.filter(problem => {
      const title = problem?.title?.toLowerCase() || '';
      const tags = problem?.tags?.toLowerCase() || '';
      const difficulty = problem?.difficulty || '';
      
      const matchesSearch = searchTerm === '' || 
        title.includes(searchLower) || 
        tags.includes(searchLower);
      const matchesTag = filterTag === 'all' || tags === filterTag.toLowerCase();
      const matchesDifficulty = filterDifficulty === 'all' || difficulty === filterDifficulty;
      
      return matchesSearch && matchesTag && matchesDifficulty;
    });
  }, [problems, searchTerm, filterTag, filterDifficulty]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link
            to="/admin"
            className="flex items-center text-blue-400 hover:text-blue-300 mr-4"
          >
            <FiChevronLeft className="mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Video Upload and Delete</h1>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search problems..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <option value="all">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tag</label>
                <select
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                >
                  <option value="all">All Tags</option>
                  <option value="array">Array</option>
                  <option value="string">String</option>
                  <option value="linkedList">Linked List</option>
                  <option value="tree">Tree</option>
                  <option value="graph">Graph</option>
                  <option value="dp">Dynamic Programming</option>
                  <option value="math">Math</option>
                  <option value="recursion">Recursion</option>
                  <option value="search">Search</option>
                  <option value="sorting">Sorting</option>
                </select>
              </div>
            </div>
          </div>

          {/* Problems List */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">
              Problems ({filteredProblems.length})
            </h2>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-700/50 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {problems.length === 0 ? 'No problems found' : 'No problems match your criteria'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProblems.map((problem) => (
                  <div key={problem._id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{problem.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[problem.difficulty]}`}>
                          {problem.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${tagColors[problem.tags]}`}>
                          {problem.tags}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link
                        to={`/admin/upload-video/${problem._id}`}
                        className="p-2 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-gray-600"
                      >
                        <RiVideoUploadLine size={18}/>
                      </Link>
                      <button
                        onClick={() => handleDelete(problem._id)}
                        className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-600"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageVideo;