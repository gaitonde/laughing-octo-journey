import React, { useState } from 'react'
import CircularProgress from "./circular-progress"
import { Separator } from "./ui/separator"
import { ChevronDown, ChevronUp } from 'lucide-react' // Make sure to install lucide-react

interface Subcategory {
  name: string
  score: number
}

interface Category {
  name: string
  score: number
  subcategories: Subcategory[]
}

interface EvaluationRatingProps {
  averageScore: number;
  definedRound: string;
  categories: Category[];
}

export default function Scoring({ averageScore, definedRound, categories }: EvaluationRatingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const overallAverageScore = categories.reduce((sum, category) => sum + category.score, 0) / categories.length;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto font-sans">
      <div
        className="flex items-start justify-between mb-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <CircularProgress
            progress={Number((overallAverageScore / 3).toFixed(1))}
            size={88}
          />
          <div className="ml-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Version #1</h2>
            <div className="flex flex-col">
              <span className="text-gray-600 text-sm mb-1">September 9, 2024 10:52am</span>
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

          {categories.map((category, index) => (
            <div key={index} className="mb-8">
              <div className="flex justify-between items-center mb-2">
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

          <div className="flex items-center justify-between bg-orange-100 p-4 rounded-lg">
            <span className="font-bold text-lg text-gray-800">Total Score</span>
            <div className="flex items-center">
              <span className="font-bold text-2xl text-gray-800 mr-3">{overallAverageScore.toFixed(1)} / 30</span>
              <div className="w-40 bg-gray-200 h-5 rounded-full overflow-hidden">
                <div className="flex-grow bg-gray-200 h-5 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-400 h-full rounded-full"
                    style={{ width: `${overallAverageScore / 30 * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
