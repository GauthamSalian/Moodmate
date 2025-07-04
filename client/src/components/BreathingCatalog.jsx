import React, { useState } from 'react';

const BreathingCatalog = () => {
  const [openType, setOpenType] = useState(null);

  const openPanel = (type) => setOpenType(type);
  const closePanel = () => setOpenType(null);

  const videos = [
    "86HUcX8ZtAk",
    "LiUnFJ8P4gM",
    "DbDoBzGY3vo",
    "VUjiXcfKBn8",
    "enJyOTvEn4M"
  ];

  const articles = [
    { text: "Deep Breathing Techniques - Art of Living", url: "https://www.artofliving.org/in-en/yoga/pranayama/deep-breathing-for-stress-relief" },
    { text: "6 Breathing Exercises - Livestrong", url: "https://www.livestrong.com/article/13727126-breathing-exercises-for-stress/" },
    { text: "Relieve Anxiety - Verywell Mind", url: "https://www.verywellmind.com/abdominal-breathing-2584115" },
    { text: "9 Exercises - LifeMD", url: "https://lifemd.com/learn/9-breathing-exercises-for-stress-and-anxiety-relief" },
    { text: "Techniques - Atria", url: "https://www.atria.org/education/breathing-techniques-for-anxiety-and-stress/" },
    { text: "Breathing - BHF", url: "https://www.bhf.org.uk/informationsupport/heart-matters-magazine/wellbeing/breathing-exercises" },
    { text: "4-7-8 Method", url: "https://www.medicalnewstoday.com/articles/324417" },
    { text: "Scientific American", url: "https://www.scientificamerican.com/article/proper-breathing-brings-better-health/" },
    { text: "Deep Breathing at Work", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9877284/" },
    { text: "Coherent Breathing Overview", url: "https://www.verywellmind.com/an-overview-of-coherent-breathing-4178943" }
  ];

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300 text-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">🧘 Featured Videos and Articles</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 cursor-pointer p-4"
          onClick={() => openPanel('video')}
        >
          <img
            src="https://img.youtube.com/vi/86HUcX8ZtAk/mqdefault.jpg"
            alt="Breathing Video"
            className="rounded-md mb-4"
          />
          <h2 className="text-xl font-semibold">Relax with Breathing</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Simple guided videos to help you unwind.</p>
          <span className="mt-2 inline-block text-xs text-blue-600 dark:text-blue-300">Youtube Videos</span>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 cursor-pointer p-4"
          onClick={() => openPanel('article')}
        >
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQekQMj5meEYW8IE9F0hKQKMBxN-tYX0d4hNw&s"
            alt="Article"
            className="rounded-md mb-4 h-36 object-cover w-full"
          />
          <h2 className="text-xl font-semibold">Top Breathing Techniques</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Expert-written articles for better breathing and less stress.</p>
          <span className="mt-2 inline-block text-xs text-blue-600 dark:text-blue-300">Articles</span>
        </div>
      </div>

      {openType && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold"
              onClick={closePanel}
            >
              &times;
            </button>

            {openType === 'video' && (
              <>
                <h3 className="text-2xl font-semibold mb-4">🎥 Breathing Exercise Videos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map(id => (
                    <iframe
                      key={id}
                      src={`https://www.youtube.com/embed/${id}`}
                      allowFullScreen
                      title={`video-${id}`}
                      className="w-full aspect-video rounded-lg"
                    ></iframe>
                  ))}
                </div>
              </>
            )}

            {openType === 'article' && (
              <>
                <h3 className="text-2xl font-semibold mb-4">📖 Helpful Breathing Articles</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {articles.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-300 hover:underline"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BreathingCatalog;
