import React from 'react';
import { Link } from 'react-router';
import { FiPlusCircle, FiEdit, FiTrash2, FiVideo } from 'react-icons/fi';

const AdminPanel = () => {
  const cards = [
    {
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: <FiPlusCircle className="text-3xl text-blue-400" />,
      path: '/admin/create-problem',
      color: 'from-blue-600 to-indigo-600'
    },
    
    {
      title: 'Update Or Delete Problem',
      description: 'Remove problems from the platform',
      icon: <FiTrash2 className="text-3xl text-red-400" />,
      path: '/admin/delete-problem',
      color: 'from-red-600 to-orange-600'
    },
    {
      title: 'Update Or Delete Videos',
      description: 'Upload and manage tutorial videos',
      icon: <FiVideo className="text-3xl text-purple-400" />,
      path: '/admin/manage-video',
      color: 'from-purple-600 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-gray-700 rounded-full">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-gray-400 mb-4">{card.description}</p>
                <Link
                  to={card.path}
                  className={`w-full py-2 bg-gradient-to-r ${card.color} text-white rounded-lg hover:opacity-90 transition-opacity`}
                >
                  Go
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;