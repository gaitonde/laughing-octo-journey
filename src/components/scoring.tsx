import React, { useState, useEffect, useRef } from 'react'
import CircularProgress from "./circular-progress"
import { Separator } from "./ui/separator"
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Subcategory {
  name: string
  score: number
}

interface Category {
  name: string
  score: number
  subcategories: Subcategory[]
}

interface Suggestion {
  category: string;
  text: string;
}

interface EvaluationRatingProps {
  averageScore: number;
  definedRound: string;
  categories: Category[];
  transcript: string | null;
  audioUrl: string;
  recordingTimestamp: Date | null;
  versionNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Scoring({ averageScore, definedRound, categories, transcript, audioUrl, recordingTimestamp, versionNumber, isExpanded, onToggle }: EvaluationRatingProps) {
  console.log('YYY Version:', versionNumber, 'Audio URL:', audioUrl);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [audioError, setAudioError] = useState<string | null>(null);
  const suggestionRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categories }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Handle error (e.g., show an error message to the user)
      }
    };

    if (isExpanded) {
      fetchSuggestions();
    }

    // Initialize refs for each category
    categories.forEach(category => {
      suggestionRefs.current[category.name] = React.createRef<HTMLDivElement>();
    });
  }, [isExpanded, audioUrl, categories]);

  const overallAverageScore = categories.reduce((sum, category) => sum + category.score, 0) / categories.length;

  // Format the timestamp
  const formattedTimestamp = recordingTimestamp
    ? recordingTimestamp.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Date not available';

  //to satisfy the type checker
  console.debug('averageScore', averageScore);
  console.debug('definedRound', definedRound);

  const scrollToSuggestion = (categoryName: string) => {
    const ref = suggestionRefs.current[categoryName];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto font-sans">
      <div
        className="flex items-start justify-between mb-6 cursor-pointer"
        onClick={onToggle} // Change this line
      >
        <div className="flex items-center">
          <CircularProgress
            progress={Number((overallAverageScore / 3).toFixed(1))}
            size={88}
          />
          <div className="ml-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Version #{versionNumber}</h2>
            <div className="flex flex-col">
              <span className="text-gray-600 text-sm mb-1">{formattedTimestamp}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {isExpanded && (
        <>

          <Separator className="my-8 h-px bg-gray-200" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Scoring</h2>

          {categories.map((category, index) => (
            <div key={index} className="mb-8">
              <div
                className="flex justify-between items-center mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                onClick={() => scrollToSuggestion(category.name)}
              >
                <span className="font-bold text-xl text-gray-800">{category.name}</span>
                <span className="font-bold text-xl text-gray-800">{(category.score / 3).toFixed(1)} / 10</span>
              </div>
              {category.subcategories.map((subcategory, subIndex) => (
                <div key={subIndex} className="flex items-center mb-2">
                  <span className="w-1/3 text-sm text-gray-600">{subcategory.name}</span>
                  <span className="w-8 text-right mr-3 text-sm font-semibold text-gray-800">
                    {subcategory.score.toFixed(1)}
                  </span>
                  <div className="flex-grow bg-gray-200 h-5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-400 h-full rounded-full"
                      style={{ width: `${(subcategory.score / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Total Score */}
          <div className="flex items-center justify-between bg-orange-100 p-4 rounded-lg mb-8">
            <span className="font-bold text-lg text-gray-800">Total Score</span>
            <div className="flex items-center">
              <span className="font-bold text-2xl text-gray-800 mr-3">{overallAverageScore.toFixed(1)} / 30</span>
            </div>
          </div>
          <Separator className="my-8 h-px bg-gray-200" />

          {/* Transcript section */}
          {transcript && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Transcript</h2>
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                &quot;{transcript}&quot;
              </blockquote>
              {audioUrl && (
                <div>
                  <audio
                    key={audioUrl}
                    className="w-full mt-4"
                    controls
                    src={audioUrl}
                    onError={(e) => {
                      const target = e.target as HTMLAudioElement;
                      const errorMessage = `Audio playback error: ${target.error?.message || 'Unknown error'}`;
                      console.error(errorMessage);
                      setAudioError(errorMessage);
                    }}
                  />
                  {audioError && <p className="text-red-500 mt-2">{audioError}</p>}
                </div>
              )}
            </div>
          )}

          {/* Suggestions section */}
          {suggestions.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-bold text-3xl text-gray-800 mb-4">Suggestions for Improvement</h2>
              {categories.map((category, index) => {
                const categorySuggestions = suggestions.filter(s => s.category === category.name);
                if (categorySuggestions.length === 0) return null;

                return (
                  <div key={index} className="mb-6" ref={suggestionRefs.current[category.name]}>
                    <h4 className="font-semibold text-xl text-gray-700 mb-2">{category.name}</h4>
                    <ul className="list-disc pl-5">
                      {categorySuggestions.map((suggestion, sIndex) => (
                        <li key={sIndex} className="text-gray-600 mb-1">{suggestion.text}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8">
              <p className="text-gray-600 text-lg">Great work. No suggestions.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
