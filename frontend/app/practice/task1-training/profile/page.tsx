'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUserIdentifier } from '../../../lib/auth';
import LoadingSpinner from '../../../components/LoadingSpinner';

/**
 * Task1 Training - Profile Creation (Step 1)
 * 20 questions to build user profile for personalized templates
 */
export default function Task1ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // 20 questions for building user profile
  const questions = [
    {
      category: '趣味・興味',
      question: 'あなたの一番の趣味は何ですか？なぜそれが好きなのか詳しく教えてください。',
      placeholder: '例：読書が好きです。新しい知識を得られるし、想像力も豊かになるからです...'
    },
    {
      category: '価値観',
      question: 'あなたにとって最も重要な価値観は何ですか？具体例も含めて説明してください。',
      placeholder: '例：誠実さが最も重要だと思います。友人関係でも仕事でも...'
    },
    {
      category: '失敗談',
      question: '過去の失敗から学んだ重要な教訓について教えてください。',
      placeholder: '例：大学受験で失敗した時、計画性の大切さを学びました...'
    },
    {
      category: '成功体験',
      question: 'あなたの人生で最も誇りに思う成功体験は何ですか？',
      placeholder: '例：部活動でキャプテンとして全国大会に出場できたことです...'
    },
    {
      category: '教育観',
      question: '効果的な学習方法について、あなたの考えを教えてください。',
      placeholder: '例：実践を通して学ぶことが最も効果的だと思います...'
    },
    {
      category: '仕事・キャリア',
      question: '理想的な職場環境について、あなたの考えを述べてください。',
      placeholder: '例：チームワークを重視し、お互いを尊重し合える環境が理想です...'
    },
    {
      category: '技術・イノベーション',
      question: 'テクノロジーが社会に与える影響について、どう思いますか？',
      placeholder: '例：テクノロジーは生活を便利にしますが、人間関係への影響も考慮すべきです...'
    },
    {
      category: '環境問題',
      question: '環境保護のために個人ができることについて、あなたの意見を聞かせてください。',
      placeholder: '例：日常生活でのリサイクルや省エネが重要だと思います...'
    },
    {
      category: '友人関係',
      question: '良い友人関係を築くために最も大切なことは何だと思いますか？',
      placeholder: '例：相互理解と信頼関係が最も重要だと考えています...'
    },
    {
      category: '時間管理',
      question: '効率的な時間管理のコツについて、あなたの経験を教えてください。',
      placeholder: '例：優先順位を明確にして、計画的に行動することが大切です...'
    },
    {
      category: '健康・ライフスタイル',
      question: '健康的な生活を送るために心がけていることはありますか？',
      placeholder: '例：規則正しい睡眠と適度な運動を心がけています...'
    },
    {
      category: '文化・多様性',
      question: '異なる文化背景を持つ人々との交流について、どう思いますか？',
      placeholder: '例：多様な文化に触れることで視野が広がると思います...'
    },
    {
      category: '困難克服',
      question: '困難な状況に直面した時、どのように対処しますか？',
      placeholder: '例：まず冷静に状況を分析し、解決策を段階的に考えます...'
    },
    {
      category: '創造性',
      question: '創造性を発揮するために大切なことは何だと思いますか？',
      placeholder: '例：固定観念にとらわれず、自由な発想を持つことが重要です...'
    },
    {
      category: 'リーダーシップ',
      question: '良いリーダーに必要な資質について、あなたの考えを教えてください。',
      placeholder: '例：チームメンバーの意見を聞き、公平な判断ができることが重要です...'
    },
    {
      category: '学習・成長',
      question: '新しいスキルを身につける時に最も効果的だと思う方法は何ですか？',
      placeholder: '例：実際に手を動かして練習することが最も効果的だと思います...'
    },
    {
      category: 'コミュニケーション',
      question: '効果的なコミュニケーションのために心がけていることはありますか？',
      placeholder: '例：相手の立場に立って考え、分かりやすく伝えることを心がけています...'
    },
    {
      category: '将来の目標',
      question: 'あなたの将来の目標と、それを達成するための計画を教えてください。',
      placeholder: '例：国際的な仕事に就くことが目標で、そのために語学力を向上させています...'
    },
    {
      category: '社会貢献',
      question: '社会に貢献するために個人ができることについて、どう思いますか？',
      placeholder: '例：ボランティア活動や地域活動に参加することが大切だと思います...'
    },
    {
      category: '人生哲学',
      question: 'あなたの人生において最も大切にしている信念や哲学は何ですか？',
      placeholder: '例：常に学び続け、成長し続けることが人生で最も大切だと思います...'
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/login');
      } else {
        setIsLoading(false);
        // Initialize answers array
        setAnswers(new Array(questions.length).fill(''));
      }
    };

    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = currentAnswer.trim();
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setCurrentAnswer(newAnswers[currentQuestion + 1] || '');
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = currentAnswer.trim();
      setAnswers(newAnswers);
      
      setCurrentQuestion(currentQuestion - 1);
      setCurrentAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const handleSaveProfile = async () => {
    if (!currentAnswer.trim()) {
      alert('現在の質問に回答してください。');
      return;
    }

    setIsSaving(true);
    try {
      // Save the final answer
      const finalAnswers = [...answers];
      finalAnswers[currentQuestion] = currentAnswer.trim();
      
      const userIdentifier = getUserIdentifier();
      if (!userIdentifier) {
        throw new Error('ユーザー情報が見つかりません。');
      }

      // TODO: Save to backend API
      console.log('Saving profile:', {
        userIdentifier,
        answers: finalAnswers,
        questions: questions.map(q => q.question)
      });

      // For now, save to localStorage as temporary storage
      localStorage.setItem('task1_profile', JSON.stringify({
        userIdentifier,
        answers: finalAnswers,
        questions: questions.map(q => q.question),
        createdAt: new Date().toISOString()
      }));

      alert('プロフィールを保存しました！次のステップに進みます。');
      router.push('/practice/task1-training');

    } catch (error) {
      console.error('Profile save failed:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToTraining = () => {
    router.push('/practice/task1-training');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="surface-elevated backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <button
            onClick={handleBackToTraining}
            className="flex items-center gap-2 text-sm hover:text-luxury transition-all duration-300"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-luxury">
            プロフィール作成
          </h1>
          <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                {currentQ.category}
              </span>
              <span className="text-sm text-gray-500">
                質問 {currentQuestion + 1}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              {currentQ.question}
            </h2>
          </div>

          {/* Answer Input */}
          <div className="mb-8">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={currentQ.placeholder}
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ fontSize: '16px' }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {currentAnswer.length} 文字
              </span>
              <span className="text-xs text-gray-400">
                詳しく書くほど、より良いテンプレートが作成されます
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              前の質問
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSaveProfile}
                disabled={!currentAnswer.trim() || isSaving}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  !currentAnswer.trim() || isSaving
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isSaving ? '保存中...' : 'プロフィール完成'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !currentAnswer.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                次の質問
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">プロフィール作成について</p>
              <p>これらの質問への回答を基に、あなた専用のTask1テンプレートを作成します。具体的で詳しい回答ほど、より効果的なテンプレートが生成されます。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}