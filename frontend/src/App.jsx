import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { courseService } from './services/courseService';
import { BACKEND_BASE_URL } from './config';
import './App.css';

function SearchableDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  emptyMessage = 'No matches found.',
  className = '',
  searchable = true,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabelRef = useRef('');

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)) || null,
    [options, value]
  );

  useEffect(() => {
    if (selectedOption) {
      selectedLabelRef.current = selectedOption.label;
      setQuery(selectedOption.label);
      return;
    }

    if (!value && query === selectedLabelRef.current) {
      setQuery('');
      selectedLabelRef.current = '';
    }
  }, [query, selectedOption, value]);

  const filteredOptions = useMemo(() => {
    if (!searchable) {
      return options;
    }

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  const handleInputChange = (event) => {
    if (!searchable) {
      return;
    }

    const nextQuery = event.target.value;
    setQuery(nextQuery);

    if (selectedOption && nextQuery !== selectedOption.label) {
      onChange('');
    }

    setIsOpen(true);
  };

  const handleSelect = (option) => {
    selectedLabelRef.current = option.label;
    onChange(String(option.value));
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <div className={`searchable-select ${className}`.trim()}>
      {label ? <label className="searchable-select-label">{label}</label> : null}
      <input
        className="searchable-select-input"
        type="text"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={!searchable}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
        onChange={handleInputChange}
      />
      {isOpen && !disabled ? (
        <div className="searchable-select-menu" role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="searchable-select-option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(option);
                }}
              >
                <span className="searchable-select-option-title">{option.label}</span>
                {option.meta ? <span className="searchable-select-option-meta">{option.meta}</span> : null}
              </button>
            ))
          ) : (
            <div className="searchable-select-empty">{emptyMessage}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Dashboard({
  isAdmin,
  userData,
  normalizedRole,
  courses,
  enrollments,
  loadingCourses,
  courseForm,
  courseActionError,
  courseActionLoading,
  editingCourseId,
  handleSignOut,
  handleSaveCourse,
  handleCourseFormChange,
  resetCourseForm,
  handleEditCourse,
  handleDeleteCourse,
  handleEnroll,
  handleUnenroll,
}) {
  const navigate = useNavigate();
  // Get enrolled course IDs
  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

  // Separate courses into enrolled and available
  const myEnrolledCourses = courses.filter(c => enrolledCourseIds.has(c.id));
  const availableCourses = courses.filter(c => !enrolledCourseIds.has(c.id));

  // Find the corresponding enrollment for a course
  const getEnrollmentForCourse = (courseId) => {
    return enrollments.find(e => e.courseId === courseId);
  };

  const stopCardNavigation = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleCardNavigation = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="app">
      <div className={`app-shell ${isAdmin ? 'admin-theme' : 'student-theme'}`}>
        <header className="app-header">
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-icon">📚</span>
            </div>
            <div className="brand-text">
              <p className="brand-eyebrow">{isAdmin ? 'StudyHub Admin Console' : 'Welcome to StudyHub'}</p>
              <h1>{isAdmin ? 'Admin Dashboard' : 'Dashboard'}</h1>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/profile" className="ghost-btn">Profile</Link>
            <button onClick={handleSignOut} className="ghost-btn">Sign Out</button>
          </div>
        </header>

        <main className="dashboard-content">
          {isAdmin ? (
            <section className="dashboard-grid">
              <section className="card info-card">
                <h3>🛠 Admin Tools</h3>
                <div className="info-list">
                  <div className="stat-item">
                    <p className="info-label">Courses</p>
                    <p className="info-value">{courses.length}</p>
                  </div>
                </div>
                <form className="admin-form" onSubmit={handleSaveCourse}>
                  <div className="admin-form-row">
                    <label htmlFor="courseName">Course Name</label>
                    <input
                      id="courseName"
                      name="name"
                      type="text"
                      value={courseForm.name}
                      onChange={handleCourseFormChange}
                      placeholder="Intro to Architecture"
                      required
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor="courseCode">Course Code</label>
                    <input
                      id="courseCode"
                      name="courseCode"
                      type="text"
                      value={courseForm.courseCode}
                      onChange={handleCourseFormChange}
                      placeholder="SWE-301"
                      required
                    />
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor="courseDescription">Description</label>
                    <textarea
                      id="courseDescription"
                      name="description"
                      value={courseForm.description}
                      onChange={handleCourseFormChange}
                      placeholder="Short course summary"
                      rows="3"
                    />
                  </div>
                  {courseActionError && (
                    <div className="admin-form-error">{courseActionError}</div>
                  )}
                  <div className="admin-form-actions">
                    <button className="admin-btn" type="submit" disabled={courseActionLoading}>
                      {courseActionLoading
                        ? 'Saving...'
                        : editingCourseId
                          ? 'Update Course'
                          : 'Create Course'}
                    </button>
                    <button
                      className="admin-btn outline"
                      type="button"
                      onClick={resetCourseForm}
                      disabled={courseActionLoading}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </section>
            </section>
          ) : (
            <section className="student-dashboard-layout">
              <div className="student-dashboard-main">
                <section className="courses-section">
                  <div className="section-header">
                    <h2>📚 My Courses</h2>
                    <p className="section-subtitle">Courses you're currently enrolled in</p>
                  </div>
                  {loadingCourses ? (
                    <div className="loading">Loading courses...</div>
                  ) : myEnrolledCourses.length > 0 ? (
                    <div className="courses-grid">
                      {myEnrolledCourses.map(course => (
                        <div
                          key={course.id}
                          className="course-card course-card-link"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleCardNavigation(course.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              handleCardNavigation(course.id);
                            }
                          }}
                        >
                          <div className="course-header">
                            <h3>{course.name}</h3>
                            <span className="course-code">{course.courseCode}</span>
                          </div>
                          <p className="course-description">{course.description || 'No description'}</p>
                          <div className="course-footer">
                            <button
                              className="unenroll-btn"
                              onClick={(event) => {
                                stopCardNavigation(event);
                                const enrollment = getEnrollmentForCourse(course.id);
                                if (enrollment) {
                                  handleUnenroll(enrollment.id);
                                }
                              }}
                            >
                              Unenroll
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't enrolled in any courses yet. Check the courses below!</p>
                    </div>
                  )}

                  <section className="courses-section courses-section-tight">
                    <div className="section-header">
                      <h2>🌟 Enroll in Courses</h2>
                      <p className="section-subtitle">Available courses you can enroll in</p>
                    </div>
                    {loadingCourses ? (
                      <div className="loading">Loading courses...</div>
                    ) : availableCourses.length > 0 ? (
                      <div className="courses-grid">
                        {availableCourses.map(course => (
                          <div key={course.id} className="course-card">
                            <div className="course-header">
                              <h3>{course.name}</h3>
                              <span className="course-code">{course.courseCode}</span>
                            </div>
                            <p className="course-description">{course.description || 'No description'}</p>
                            <div className="course-footer">
                              <button
                                className="enroll-btn"
                                onClick={() => handleEnroll(course.id)}
                              >
                                Enroll
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <p>You're enrolled in all available courses!</p>
                      </div>
                    )}
                  </section>
                </section>

                <aside className="student-dashboard-sidebar">
                  <section className="card student-progress-card">
                    <h3>📊 Your Progress</h3>
                    <div className="info-list">
                      <div className="stat-item">
                        <p className="info-label">📌 Active Courses</p>
                        <p className="info-value">{myEnrolledCourses.length}</p>
                      </div>
                      <div className="stat-item">
                        <p className="info-label">🚀 To Explore</p>
                        <p className="info-value">{availableCourses.length}</p>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
            </section>
          )}
            {isAdmin && (
              <section className="courses-section">
                <div className="section-header">
                  <h2>📘 All Courses</h2>
                  <p className="section-subtitle">Manage and oversee every course</p>
                </div>
                {loadingCourses ? (
                  <div className="loading">Loading courses...</div>
                ) : courses.length > 0 ? (
                  <div className="courses-grid">
                    {courses.map(course => (
                      <div
                        key={course.id}
                        className="course-card course-card-link"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCardNavigation(course.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            handleCardNavigation(course.id);
                          }
                        }}
                      >
                        <div className="course-header">
                          <h3>{course.name}</h3>
                          <span className="course-code">{course.courseCode}</span>
                        </div>
                        <p className="course-description">{course.description || 'No description'}</p>
                        <div className="course-footer">
                          <button
                            className="admin-btn outline"
                            onClick={(event) => {
                              stopCardNavigation(event);
                              handleEditCourse(course);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-btn"
                            onClick={(event) => {
                              stopCardNavigation(event);
                              handleDeleteCourse(course.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No courses found yet.</p>
                  </div>
                )}
              </section>
            )}
        </main>
      </div>
    </div>
  );
}

function ProfilePage({ isAdmin, userData, normalizedRole, onSignOut }) {
  return (
    <div className="app">
      <div className={`app-shell ${isAdmin ? 'admin-theme' : 'student-theme'}`}>
        <header className="app-header">
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-icon">📚</span>
            </div>
            <div className="brand-text">
              <p className="brand-eyebrow">Profile</p>
              <h1>{userData?.name || 'Account'}</h1>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/" className="ghost-btn">Back to Dashboard</Link>
            <button onClick={onSignOut} className="ghost-btn">Sign Out</button>
          </div>
        </header>

        <main className="profile-page">
          <section className="card profile-card">
            <div className="avatar">{userData?.name?.charAt(0)?.toUpperCase() || 'S'}</div>
            <div className="profile-info">
              <h2>{userData?.name || 'Student'}</h2>
              <p className="email">{userData?.email || 'Signed-in user'}</p>
              {userData?.role && (
                <span className={`role-badge ${isAdmin ? 'role-badge-admin' : 'role-badge-student'}`}>
                  {normalizedRole.replace('ROLE_', '')}
                </span>
              )}
              <div className="profile-meta">
                <div className="meta-row">
                  <span className="meta-label">User ID</span>
                  <span className="meta-value">{userData?.id ?? '—'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Status</span>
                  <span className="meta-value">Active</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Joined</span>
                  <span className="meta-value">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function CoursePage({ isAdmin, userData, courses, enrollments }) {
  const { courseId } = useParams();
  const parsedCourseId = Number(courseId);
  const maxUploadSizeBytes = 25 * 1024 * 1024;
  const [files, setFiles] = useState([]);
  const [ratingsByFile, setRatingsByFile] = useState({});
  const [averagesByFile, setAveragesByFile] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [ratingInputs, setRatingInputs] = useState({});
  const [ratingSaving, setRatingSaving] = useState({});
  const [ratingErrors, setRatingErrors] = useState({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatTab, setChatTab] = useState('chat');
  const [myChats, setMyChats] = useState([]);
  const [myChatsLoading, setMyChatsLoading] = useState(false);
  const [myChatsError, setMyChatsError] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const stompClientRef = useRef(null);
  const chatTabRef = useRef(chatTab);
  const selectedChatUserIdRef = useRef(selectedChatUserId);
  const chatNotificationSubscriptionRef = useRef(null);
  const chatSubscriptionRef = useRef(null);
  const chatScrollRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminEnrollments, setAdminEnrollments] = useState([]);
  const [adminRosterLoading, setAdminRosterLoading] = useState(false);
  const [adminRosterError, setAdminRosterError] = useState('');
  const [selectedEnrollUserId, setSelectedEnrollUserId] = useState('');
  const [selectedUnenrollEnrollmentId, setSelectedUnenrollEnrollmentId] = useState('');
  const [adminEnrollActionLoading, setAdminEnrollActionLoading] = useState(false);
  const [adminEnrollActionError, setAdminEnrollActionError] = useState('');
  const [filesSortBy, setFilesSortBy] = useState('');
  const [filesSortDirection, setFilesSortDirection] = useState('');

  const filesSortOptions = [
    { value: '', label: 'Default (newest first)' },
    { value: 'DATE', label: 'Date uploaded' },
    { value: 'ALPHA', label: 'Alphabetical' },
    { value: 'RATING', label: 'Rating' },
  ];

  const getFilesSortDirectionOptions = (sortBy) => {
    switch (sortBy) {
      case 'DATE':
        return [
          { value: 'DESC', label: 'Newest to Oldest' },
          { value: 'ASC', label: 'Oldest to Newest' },
        ];
      case 'ALPHA':
        return [
          { value: 'ASC', label: 'A to Z' },
          { value: 'DESC', label: 'Z to A' },
        ];
      case 'RATING':
        return [
          { value: 'DESC', label: 'Highest to Lowest' },
          { value: 'ASC', label: 'Lowest to Highest' },
        ];
      default:
        return [];
    }
  };

  const handleFilesSortByChange = (nextSortBy) => {
    setFilesSortBy(nextSortBy);

    if (!nextSortBy) {
      setFilesSortDirection('');
      return;
    }

    if (nextSortBy === 'ALPHA') {
      setFilesSortDirection('ASC');
      return;
    }

    setFilesSortDirection('DESC');
  };

  const course = useMemo(
    () => courses.find((item) => item.id === parsedCourseId),
    [courses, parsedCourseId]
  );

  const isEnrolled = useMemo(
    () => enrollments.some((enrollment) => enrollment.courseId === parsedCourseId),
    [enrollments, parsedCourseId]
  );
  const shouldBlockAccess = !isAdmin && !isEnrolled;

  const selectedChatUser = useMemo(
    () => {
      const onlineUser = onlineUsers.find((user) => String(user.id) === String(selectedChatUserId));
      if (onlineUser) {
        return onlineUser;
      }

      const savedChat = myChats.find((chat) => String(chat.peerUserId) === String(selectedChatUserId));
      if (savedChat) {
        return {
          id: savedChat.peerUserId,
          fullName: savedChat.peerName,
          role: 'Student',
          online: savedChat.peerOnline,
        };
      }

      return null;
    },
    [myChats, onlineUsers, selectedChatUserId]
  );

  const chatUsers = useMemo(
    () => onlineUsers.filter((user) => String(user.id) !== String(userData?.id)),
    [onlineUsers, userData?.id]
  );

  const adminEnrollOptions = useMemo(
    () => adminUsers
      .filter((user) => user.role !== 'ADMIN')
      .filter((user) => !adminEnrollments.some((enrollment) => enrollment.userId === user.id))
      .map((user) => ({
        value: String(user.id),
        label: user.fullName,
        meta: user.email,
      })),
    [adminEnrollments, adminUsers]
  );

  const unenrollOptions = useMemo(
    () => adminEnrollments.map((enrollment) => {
      const user = adminUsers.find((item) => item.id === enrollment.userId);
      const label = user ? user.fullName : `User #${enrollment.userId}`;

      return {
        value: String(enrollment.id),
        label,
        meta: user ? user.email : '',
      };
    }),
    [adminEnrollments, adminUsers]
  );

  const chatSelectOptions = useMemo(() => {
    const options = chatUsers.map((user) => ({
      value: String(user.id),
      label: user.fullName,
      meta: user.role,
    }));

    if (selectedChatUser && !options.some((option) => String(option.value) === String(selectedChatUser.id))) {
      options.unshift({
        value: String(selectedChatUser.id),
        label: selectedChatUser.fullName,
        meta: selectedChatUser.role,
      });
    }

    return options;
  }, [chatUsers, selectedChatUser]);

  const onlineUserCount = onlineUsers.length;
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const currentUserId = Number(userData?.id);
  const selectedPeerId = selectedChatUserId ? Number(selectedChatUserId) : Number.NaN;
  const chatRoomKey = useMemo(() => {
    if (!selectedChatUserId || !parsedCourseId || !Number.isFinite(currentUserId) || !Number.isFinite(selectedPeerId)) {
      return '';
    }

    const lowerId = Math.min(currentUserId, selectedPeerId);
    const higherId = Math.max(currentUserId, selectedPeerId);
    return `${parsedCourseId}:${lowerId}:${higherId}`;
  }, [parsedCourseId, currentUserId, selectedPeerId]);

  useEffect(() => {
    const stillOnline = chatUsers.some((user) => String(user.id) === String(selectedChatUserId));
    const stillSaved = myChats.some((chat) => String(chat.peerUserId) === String(selectedChatUserId));

    if (selectedChatUserId && !stillOnline && !stillSaved) {
      setSelectedChatUserId('');
      setChatMessages([]);
    }
  }, [chatUsers, myChats, selectedChatUserId]);

  useEffect(() => {
    chatTabRef.current = chatTab;
  }, [chatTab]);

  useEffect(() => {
    selectedChatUserIdRef.current = selectedChatUserId;
  }, [selectedChatUserId]);

  useEffect(() => {
    if (chatTab !== 'chat' || !selectedChatUserId) {
      return;
    }

    setUnreadCounts((prev) => {
      if (!prev[selectedChatUserId]) {
        return prev;
      }

      const next = { ...prev };
      delete next[selectedChatUserId];
      return next;
    });
  }, [selectedChatUserId, chatTab]);

  const refreshMyChats = async () => {
    if (!socketConnected || shouldBlockAccess) {
      setMyChats([]);
      return;
    }

    try {
      setMyChatsLoading(true);
      setMyChatsError('');
      const chats = await courseService.getMyChats(parsedCourseId);
      setMyChats(chats);
    } catch (err) {
      setMyChats([]);
      setMyChatsError(err.response?.data?.message || 'Failed to load chats.');
    } finally {
      setMyChatsLoading(false);
    }
  };

  useEffect(() => {
    refreshMyChats();
  }, [socketConnected, shouldBlockAccess, parsedCourseId, onlineUsers]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, selectedChatUserId]);

  const sortCourseFiles = (courseFiles, sortBy, sortDirection, averageMap = {}) => {
    const normalizedDirection = (sortDirection || 'DESC').toUpperCase();

    return [...courseFiles].sort((left, right) => {
      if (sortBy === 'RATING') {
        const leftAverage = averageMap[left.id]?.average ?? 0;
        const rightAverage = averageMap[right.id]?.average ?? 0;

        if (leftAverage !== rightAverage) {
          return normalizedDirection === 'ASC'
            ? leftAverage - rightAverage
            : rightAverage - leftAverage;
        }
      }

      if (sortBy === 'DATE') {
        const leftDate = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
        const rightDate = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;

        if (leftDate !== rightDate) {
          return normalizedDirection === 'ASC' ? leftDate - rightDate : rightDate - leftDate;
        }
      }

      if (sortBy === 'ALPHA') {
        const comparison = (left.fileName || '').localeCompare(right.fileName || '', undefined, {
          sensitivity: 'base',
        });

        if (comparison !== 0) {
          return normalizedDirection === 'ASC' ? comparison : -comparison;
        }
      }

      const leftUploadedAt = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
      const rightUploadedAt = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;

      if (leftUploadedAt !== rightUploadedAt) {
        return rightUploadedAt - leftUploadedAt;
      }

      return (Number(right.id) || 0) - (Number(left.id) || 0);
    });
  };

  const loadCourseFiles = async (isMounted, sortBy, sortDirection) => {
    if (!parsedCourseId) {
      setError('Invalid course id.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const courseFiles = await courseService.getFilesByCourse(parsedCourseId);
      if (!isMounted) {
        return;
      }

      const ratingResults = await Promise.all(
        courseFiles.map(async (file) => {
          const [ratings, average] = await Promise.all([
            courseService.getRatingsByFile(file.id),
            courseService.getAverageRating(file.id),
          ]);
          return { fileId: file.id, ratings, average };
        })
      );

      if (!isMounted) {
        return;
      }

      const ratingsMap = {};
      const averageMap = {};
      ratingResults.forEach(({ fileId, ratings, average }) => {
        ratingsMap[fileId] = ratings;
        averageMap[fileId] = average;
      });

      const sortedFiles = sortCourseFiles(courseFiles, sortBy, sortDirection, averageMap);

      if (!isMounted) {
        return;
      }

      setFiles(sortedFiles);
      setRatingsByFile(ratingsMap);
      setAveragesByFile(averageMap);
    } catch (err) {
      if (isMounted) {
        setError(err.response?.data?.message || 'Failed to load course files.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (shouldBlockAccess) {
      return () => {
        isMounted = false;
      };
    }

    loadCourseFiles(isMounted, filesSortBy, filesSortDirection);

    return () => {
      isMounted = false;
    };
  }, [parsedCourseId, shouldBlockAccess, filesSortBy, filesSortDirection]);

  useEffect(() => {
    let isMounted = true;

    if (!isAdmin || !parsedCourseId) {
      return () => {
        isMounted = false;
      };
    }

    const loadAdminRoster = async () => {
      if (isMounted) {
        setAdminRosterLoading(true);
        setAdminRosterError('');
      }

      try {
        const [users, enrollments] = await Promise.all([
          courseService.getAllUsers(),
          courseService.getEnrollmentsByCourse(parsedCourseId),
        ]);
        if (!isMounted) {
          return;
        }
        setAdminUsers(users);
        setAdminEnrollments(enrollments);
      } catch (err) {
        if (isMounted) {
          setAdminRosterError(err.response?.data?.message || 'Failed to load enrollment roster.');
          setAdminUsers([]);
          setAdminEnrollments([]);
        }
      } finally {
        if (isMounted) {
          setAdminRosterLoading(false);
        }
      }
    };

    loadAdminRoster();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, parsedCourseId]);

  useEffect(() => {
    let isMounted = true;

    if (!parsedCourseId || !userData?.id || shouldBlockAccess) {
      return () => {
        isMounted = false;
      };
    }

    const loadOnlineUsers = async () => {
      if (isMounted) {
        setOnlineUsersLoading(true);
      }

      try {
        const users = await courseService.getOnlineUsersByCourse(parsedCourseId);
        if (isMounted) {
          setOnlineUsers(users);
        }
      } catch (err) {
        if (isMounted) {
          setOnlineUsers([]);
        }
      } finally {
        if (isMounted) {
          setOnlineUsersLoading(false);
        }
      }
    };

    loadOnlineUsers();

    const authToken = localStorage.getItem('token') || '';

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_BASE_URL}/ws?token=${encodeURIComponent(authToken)}`),
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        if (!isMounted) {
          return;
        }

        setSocketConnected(true);

        client.publish({
          destination: `/app/courses/${parsedCourseId}/presence/join`,
          body: JSON.stringify({}),
        });

        client.subscribe(`/topic/courses/${parsedCourseId}/online-users`, (message) => {
          if (!isMounted) {
            return;
          }

          try {
            const users = JSON.parse(message.body);
            setOnlineUsers(users);
          } catch (error) {
            console.error('Failed to parse online users update:', error);
          }
        });

        if (chatNotificationSubscriptionRef.current) {
          chatNotificationSubscriptionRef.current.unsubscribe();
          chatNotificationSubscriptionRef.current = null;
        }

        chatNotificationSubscriptionRef.current = client.subscribe(`/topic/courses/${parsedCourseId}/chat-notifications`, (message) => {
          if (!isMounted) {
            return;
          }

          try {
            const notification = JSON.parse(message.body);
            const peerId = String(notification.senderUserId === currentUserId ? notification.recipientUserId : notification.senderUserId);

            if (notification.recipientUserId !== currentUserId) {
              return;
            }

            if (chatTabRef.current === 'chat' && String(selectedChatUserIdRef.current) === peerId) {
              return;
            }

            setUnreadCounts((prev) => ({
              ...prev,
              [peerId]: (prev[peerId] || 0) + 1,
            }));
          } catch (error) {
            console.error('Failed to parse chat notification:', error);
          }
        });
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      isMounted = false;
      setSocketConnected(false);
      if (chatNotificationSubscriptionRef.current) {
        chatNotificationSubscriptionRef.current.unsubscribe();
        chatNotificationSubscriptionRef.current = null;
      }
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
      if (stompClientRef.current) {
        if (stompClientRef.current.connected) {
          stompClientRef.current.publish({
            destination: `/app/courses/${parsedCourseId}/presence/leave`,
            body: JSON.stringify({}),
          });
        }
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [parsedCourseId, userData?.id, shouldBlockAccess]);

  useEffect(() => {
    let isMounted = true;
    const client = stompClientRef.current;

    if (!socketConnected || shouldBlockAccess || !client || !selectedChatUserId) {
      setChatMessages([]);
      setChatLoading(false);
      setChatError('');
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
      return () => {
        isMounted = false;
      };
    }

    const peerUserId = Number(selectedChatUserId);
    if (!Number.isFinite(peerUserId)) {
      return () => {
        isMounted = false;
      };
    }

    const loadChatHistory = async () => {
      setChatLoading(true);
      setChatError('');

      try {
        const messages = await courseService.getChatHistory(parsedCourseId, peerUserId);
        if (!isMounted) {
          return;
        }
        setChatMessages(messages);
      } catch (err) {
        if (isMounted) {
          setChatMessages([]);
          setChatError(err.response?.data?.message || 'Failed to load chat history.');
        }
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    const subscription = client.subscribe(`/topic/courses/${parsedCourseId}/chat/${chatRoomKey}`, (message) => {
      if (!isMounted) {
        return;
      }

      try {
        const incomingMessage = JSON.parse(message.body);
        setChatMessages((prev) => [...prev, incomingMessage]);
        if (chatTab !== 'chat') {
          setUnreadCounts((prev) => {
            const peerId = String(incomingMessage.senderUserId === currentUserId ? incomingMessage.recipientUserId : incomingMessage.senderUserId);
            return {
              ...prev,
              [peerId]: (prev[peerId] || 0) + 1,
            };
          });
        }
      } catch (error) {
        console.error('Failed to parse chat message:', error);
      }
    });

    chatSubscriptionRef.current = subscription;
    loadChatHistory();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (chatSubscriptionRef.current === subscription) {
        chatSubscriptionRef.current = null;
      }
    };
  }, [socketConnected, selectedChatUserId, parsedCourseId, shouldBlockAccess, chatRoomKey]);

  const sendChatMessage = async () => {

    if (!selectedChatUserId || !chatDraft.trim() || !socketConnected || shouldBlockAccess) {
      return;
    }

    const client = stompClientRef.current;
    if (!client || !client.connected) {
      setChatError('Chat connection is not ready yet.');
      return;
    }

    setChatSending(true);
    setChatError('');

    try {
      client.publish({
        destination: `/app/courses/${parsedCourseId}/chat/send`,
        body: JSON.stringify({
          recipientUserId: Number(selectedChatUserId),
          content: chatDraft.trim(),
        }),
      });
      setChatDraft('');
      refreshMyChats();
    } catch (err) {
      setChatError('Failed to send message.');
    } finally {
      setChatSending(false);
    }
  };

  const handleSendChatMessage = async (event) => {
    event.preventDefault();
    await sendChatMessage();
  };

  const handleChatComposerKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendChatMessage();
    }
  };

  if (shouldBlockAccess) {
    return (
      <div className="app">
        <div className={`app-shell ${isAdmin ? 'admin-theme' : 'student-theme'}`}>
          <header className="app-header">
            <div className="brand">
              <div className="brand-mark">
                <span className="brand-icon">📚</span>
              </div>
              <div className="brand-text">
                <p className="brand-eyebrow">Course Access</p>
                <h1>Enrollment Required</h1>
              </div>
            </div>
            <div className="header-actions">
              <Link to="/" className="ghost-btn">Back to Dashboard</Link>
            </div>
          </header>
          <main className="profile-page">
            <section className="card">
              <p className="section-subtitle">
                You need to be enrolled in this course to access its workspace.
              </p>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile || !parsedCourseId) {
      setUploadError('Select a file to upload.');
      return;
    }

    if (selectedFile.size > maxUploadSizeBytes) {
      setUploadError('File is too large. Max file limit is 25 MB.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      await courseService.uploadCourseFile(parsedCourseId, selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadCourseFiles(true, filesSortBy, filesSortDirection);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelection = (file) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError('');
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragDepthRef.current = 0;
    setIsDraggingFile(false);

    const droppedFile = event.dataTransfer.files?.[0];
    handleFileSelection(droppedFile || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    const shouldDelete = window.confirm('Delete this file? This cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await courseService.deleteFile(fileId);
      await loadCourseFiles(true, filesSortBy, filesSortDirection);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (fileId, value) => {
    setRatingInputs((prev) => ({
      ...prev,
      [fileId]: value,
    }));
  };

  const handleSaveRating = async (fileId) => {
    const value = Number(ratingInputs[fileId]);
    if (!value || value < 1 || value > 5) {
      setRatingErrors((prev) => ({
        ...prev,
        [fileId]: 'Select a rating from 1 to 5.',
      }));
      return;
    }

    setRatingSaving((prev) => ({ ...prev, [fileId]: true }));
    setRatingErrors((prev) => ({ ...prev, [fileId]: '' }));

    try {
      await courseService.upsertRating(fileId, userData?.id, value);
      await loadCourseFiles(true, filesSortBy, filesSortDirection);
    } catch (err) {
      setRatingErrors((prev) => ({
        ...prev,
        [fileId]: err.response?.data?.message || 'Failed to save rating.',
      }));
    } finally {
      setRatingSaving((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleRemoveRating = async (fileId) => {
    setRatingSaving((prev) => ({ ...prev, [fileId]: true }));
    setRatingErrors((prev) => ({ ...prev, [fileId]: '' }));

    try {
      await courseService.deleteRating(fileId, userData?.id);
      setRatingInputs((prev) => ({ ...prev, [fileId]: '' }));
      await loadCourseFiles(true, filesSortBy, filesSortDirection);
    } catch (err) {
      setRatingErrors((prev) => ({
        ...prev,
        [fileId]: err.response?.data?.message || 'Failed to remove rating.',
      }));
    } finally {
      setRatingSaving((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleAdminEnroll = async () => {
    if (!selectedEnrollUserId) {
      setAdminEnrollActionError('Select a student to enroll.');
      return;
    }

    setAdminEnrollActionLoading(true);
    setAdminEnrollActionError('');

    try {
      await courseService.enrollUserInCourse(parsedCourseId, Number(selectedEnrollUserId));
      const enrollments = await courseService.getEnrollmentsByCourse(parsedCourseId);
      setAdminEnrollments(enrollments);
      setSelectedEnrollUserId('');
    } catch (err) {
      setAdminEnrollActionError(err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setAdminEnrollActionLoading(false);
    }
  };

  const handleAdminUnenroll = async () => {
    if (!selectedUnenrollEnrollmentId) {
      setAdminEnrollActionError('Select an enrolled student to remove.');
      return;
    }

    setAdminEnrollActionLoading(true);
    setAdminEnrollActionError('');

    try {
      await courseService.unenrollCourse(Number(selectedUnenrollEnrollmentId));
      const enrollments = await courseService.getEnrollmentsByCourse(parsedCourseId);
      setAdminEnrollments(enrollments);
      setSelectedUnenrollEnrollmentId('');
    } catch (err) {
      setAdminEnrollActionError(err.response?.data?.message || 'Failed to unenroll student.');
    } finally {
      setAdminEnrollActionLoading(false);
    }
  };

  return (
    <div className="app">
      <div className={`app-shell ${isAdmin ? 'admin-theme' : 'student-theme'}`}>
        <header className="app-header">
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-icon">📚</span>
            </div>
            <div className="brand-text">
              <p className="brand-eyebrow">Course Workspace</p>
              <h1>{course?.name || 'Course Details'}</h1>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/" className="ghost-btn">Back to Dashboard</Link>
            <Link to="/profile" className="ghost-btn">Profile</Link>
          </div>
        </header>

        <main className="course-page">
          <section className="course-main">
            <div className="course-summary">
              <div>
                <p className="course-kicker">Course</p>
                <h2>{course?.name || 'Unknown course'}</h2>
                <p className="course-subtitle">{course?.description || 'No description available yet.'}</p>
              </div>
              <span className="course-code badge">{course?.courseCode || 'CODE'}</span>
            </div>

            <section className="card course-stats-card">
              <div className="section-header section-header-inline">
                <div>
                  <h3>Course Stats</h3>
                  <p className="section-subtitle">Quick snapshot for this course.</p>
                </div>
              </div>
              <div className="info-list info-list-inline">
                <div className="stat-item">
                  <p className="info-label">Files</p>
                  <p className="info-value">{files.length}</p>
                </div>
                <div className="stat-item">
                  <p className="info-label">Last Update</p>
                  <p className="info-value">{files[0]?.uploadedAt ? new Date(files[0].uploadedAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </section>

            {isAdmin && (
              <section className="card course-admin-actions">
                <div className="section-header section-header-inline">
                  <div>
                    <h3>Manage Enrollments</h3>
                    <p className="section-subtitle">Enroll or remove students from this course.</p>
                  </div>
                </div>
                {adminRosterError && <div className="admin-form-error">{adminRosterError}</div>}
                <div className="course-admin-grid">
                  <div className="course-admin-panel">
                    <h4>Enroll Student</h4>
                    <p className="section-subtitle">Add a student to this course.</p>
                    <SearchableDropdown
                      label=""
                      value={selectedEnrollUserId}
                      onChange={(nextValue) => setSelectedEnrollUserId(nextValue)}
                      options={adminEnrollOptions}
                      placeholder={adminRosterLoading ? 'Loading students...' : 'Search students to enroll'}
                      disabled={adminRosterLoading || adminEnrollActionLoading}
                      emptyMessage="No matching students found."
                      className="searchable-select-admin"
                    />
                    <button
                      className="admin-btn"
                      type="button"
                      onClick={handleAdminEnroll}
                      disabled={adminRosterLoading || adminEnrollActionLoading}
                    >
                      {adminEnrollActionLoading ? 'Working...' : 'Enroll'}
                    </button>
                  </div>
                  <div className="course-admin-panel">
                    <h4>Unenroll Student</h4>
                    <p className="section-subtitle">Remove a student from this course.</p>
                    <SearchableDropdown
                      label=""
                      value={selectedUnenrollEnrollmentId}
                      onChange={(nextValue) => setSelectedUnenrollEnrollmentId(nextValue)}
                      options={unenrollOptions}
                      placeholder={adminRosterLoading ? 'Loading enrollments...' : 'Search enrolled students'}
                      disabled={adminRosterLoading || adminEnrollActionLoading}
                      emptyMessage="No enrolled students match your search."
                      className="searchable-select-admin"
                    />
                    <button
                      className="admin-btn"
                      type="button"
                      onClick={handleAdminUnenroll}
                      disabled={adminRosterLoading || adminEnrollActionLoading}
                    >
                      {adminEnrollActionLoading ? 'Working...' : 'Unenroll'}
                    </button>
                  </div>
                </div>
                {adminEnrollActionError && <div className="admin-form-error">{adminEnrollActionError}</div>}
              </section>
            )}

            <form
              className={`upload-card ${isDraggingFile ? 'upload-card-dragging' : ''}`}
              onSubmit={handleFileUpload}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-copy">
                <div>
                  <p className="course-kicker">Upload</p>
                  <h3>Share a file with the class</h3>
                  <p className="course-subtitle">PDF, slides, or notes for this course.</p>
                </div>
                <span className="upload-limit">Max file limit: 25 MB</span>
              </div>
              <div className="upload-dropzone">
                <div className="dropzone-icon">⬆</div>
                <div className="dropzone-copy">
                  <p className="dropzone-title">Drag and drop your file here</p>
                  <p className="dropzone-subtitle">or use the picker below to browse your device.</p>
                </div>
              </div>
              <div className="upload-actions">
                <label className="file-picker">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(event) => handleFileSelection(event.target.files?.[0] || null)}
                  />
                  <span>{selectedFile ? selectedFile.name : 'Choose file'}</span>
                </label>
                <button className="admin-btn upload-button" type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {selectedFile && (
                <div className="selected-file-row">
                  <p className="selected-file-text">Selected: {selectedFile.name}</p>
                  <button
                    className="selected-file-clear"
                    type="button"
                    onClick={handleClearSelectedFile}
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              )}
              {uploadError && <div className="admin-form-error">{uploadError}</div>}
            </form>

            <section className="card course-files-sort">
              <div className="section-header section-header-inline">
                <div>
                  <p className="course-kicker">Sorting</p>
                  <h3>Arrange files</h3>
                  <p className="section-subtitle">Choose how the course files should be ordered.</p>
                </div>
              </div>
              <div className="sort-panel">
                <SearchableDropdown
                  label="Sort by"
                  value={filesSortBy}
                  onChange={handleFilesSortByChange}
                  options={filesSortOptions}
                  placeholder="Default (newest first)"
                  emptyMessage="No sort options found."
                  className="sort-dropdown"
                  searchable={false}
                />
                <SearchableDropdown
                  label="Direction"
                  value={filesSortDirection}
                  onChange={setFilesSortDirection}
                  options={getFilesSortDirectionOptions(filesSortBy)}
                  placeholder={filesSortBy ? 'Choose a direction' : 'Select a sort type first'}
                  disabled={!filesSortBy}
                  emptyMessage="No direction options available."
                  className="sort-dropdown"
                  searchable={false}
                />
              </div>
            </section>

            {loading && <div className="loading">Loading files...</div>}
            {error && <div className="admin-form-error">{error}</div>}

            {!loading && !error && files.length === 0 && (
              <div className="empty-state">
                <p>No files have been uploaded for this course yet.</p>
              </div>
            )}

            <div className="file-list">
              {files.map((file) => {
                const ratings = ratingsByFile[file.id] || [];
                const average = averagesByFile[file.id];
                const averageValue = average?.average ?? null;
                const ratingCount = average?.count ?? ratings.length;

                return (
                  <div key={file.id} className="file-card">
                    <div className="file-main">
                      <div>
                        <h3>
                          <a className="file-link" href={file.fileUrl} download>
                            {file.fileName}
                          </a>
                        </h3>
                        <p className="file-meta">
                          {file.fileType || 'file'} • {(file.fileSize || 0) / 1024 > 0 ? `${Math.round(file.fileSize / 1024)} KB` : '—'}
                        </p>
                        <span className="uploader-chip">Uploaded by {file.uploadedByName || 'Unknown'}</span>
                      </div>
                      <div className="file-actions">
                        {(isAdmin || file.uploadedBy === userData?.id) && (
                          <button
                            className="admin-btn outline"
                            type="button"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="file-rating">
                      <div>
                        <p className="info-label">Average rating</p>
                        <p className="info-value">{averageValue !== null ? averageValue.toFixed(1) : '—'}</p>
                      </div>
                      <div>
                        <p className="info-label">Ratings</p>
                        <p className="info-value">{ratingCount}</p>
                      </div>
                      <div className="rating-actions">
                        <p className="info-label">Your rating</p>
                        <div className="rating-controls">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              className={`rating-star ${Number(ratingInputs[file.id]) >= value ? 'active' : ''}`}
                              onClick={() => handleRatingChange(file.id, value)}
                            >
                              ★
                            </button>
                          ))}
                          <button
                            className="admin-btn"
                            type="button"
                            onClick={() => handleSaveRating(file.id)}
                            disabled={ratingSaving[file.id]}
                          >
                            {ratingSaving[file.id] ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="admin-btn outline"
                            type="button"
                            onClick={() => handleRemoveRating(file.id)}
                            disabled={ratingSaving[file.id]}
                          >
                            Remove
                          </button>
                        </div>
                        {ratingErrors[file.id] && (
                          <div className="admin-form-error">{ratingErrors[file.id]}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="course-sidebar">
            <section className="card course-chat-panel">
              <div className="chat-header">
                <div>
                  <h3>Course Chat</h3>
                  <p className="section-subtitle">Session-only chat for users in this course.</p>
                </div>
              </div>
              <div className="chat-tabs">
                <button
                  type="button"
                  className={`chat-tab ${chatTab === 'chat' ? 'chat-tab-active' : ''}`}
                  onClick={() => setChatTab('chat')}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className={`chat-tab ${chatTab === 'my-chats' ? 'chat-tab-active' : ''}`}
                  onClick={() => setChatTab('my-chats')}
                >
                  My Chats
                  {totalUnreadCount > 0 ? <span className="chat-tab-badge">{totalUnreadCount}</span> : null}
                </button>
              </div>

              {chatTab === 'my-chats' ? (
                <div className="chat-thread chat-thread-list">
                  {myChatsLoading ? (
                    <div className="chat-empty-state">
                      <p className="chat-placeholder-title">Loading chats</p>
                      <p className="chat-placeholder-text">Fetching your saved conversations.</p>
                    </div>
                  ) : myChats.length === 0 ? (
                    <div className="chat-empty-state">
                      <p className="chat-placeholder-title">No active chats</p>
                      <p className="chat-placeholder-text">
                        Start a conversation with someone online and it will appear here until both users sign out.
                      </p>
                    </div>
                  ) : (
                    myChats.map((chat) => (
                      <button
                        key={`${chat.courseId}:${chat.peerUserId}`}
                        type="button"
                        className="my-chat-card"
                        onClick={() => {
                          setSelectedChatUserId(String(chat.peerUserId));
                          setChatTab('chat');
                          setUnreadCounts((prev) => {
                            if (!prev[String(chat.peerUserId)]) {
                              return prev;
                            }

                            const next = { ...prev };
                            delete next[String(chat.peerUserId)];
                            return next;
                          });
                        }}
                      >
                        <div className="my-chat-card-top">
                          <div>
                            <p className="my-chat-name">{chat.peerName}</p>
                            <p className="my-chat-meta">{chat.messageCount} messages</p>
                          </div>
                            <div className="my-chat-pill-group">
                              {unreadCounts[String(chat.peerUserId)] ? (
                                <span className="my-chat-pill my-chat-pill-unread">
                                  {unreadCounts[String(chat.peerUserId)]} new
                                </span>
                              ) : null}
                              <span className={`my-chat-pill ${chat.peerOnline ? 'my-chat-pill-live' : 'my-chat-pill-offline'}`}>
                                {chat.peerOnline ? 'Active' : 'Offline'}
                              </span>
                            </div>
                        </div>
                        <p className="my-chat-preview">{chat.lastMessage}</p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  <div className="chat-control-row">
                    <div className="chat-control-group">
                      <label htmlFor="chatUserSelect" className="chat-control-label">Chat with</label>
                      <SearchableDropdown
                        label=""
                        value={selectedChatUserId}
                        onChange={(nextValue) => setSelectedChatUserId(nextValue)}
                        options={chatSelectOptions}
                        placeholder={onlineUsersLoading ? 'Loading users...' : 'Search users to chat with'}
                        disabled={onlineUsersLoading || chatSelectOptions.length === 0}
                        emptyMessage={onlineUsersLoading ? 'Loading users...' : 'No users match your search.'}
                        className="searchable-select-chat"
                      />
                    </div>
                    <div className="chat-online-count">
                      <span className="online-dot" />
                      <span>{onlineUserCount} online</span>
                    </div>
                  </div>
                  <div className="chat-thread" ref={chatScrollRef}>
                    {!selectedChatUser ? (
                      <div className="chat-empty-state">
                        <p className="chat-placeholder-title">Choose someone to start chatting</p>
                        <p className="chat-placeholder-text">
                          Select an online user above to open a live peer-to-peer chat.
                        </p>
                      </div>
                    ) : chatLoading ? (
                      <div className="chat-empty-state">
                        <p className="chat-placeholder-title">Loading conversation</p>
                        <p className="chat-placeholder-text">Fetching the current session history.</p>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="chat-empty-state">
                        <p className="chat-placeholder-title">No messages yet</p>
                        <p className="chat-placeholder-text">
                          Say hello to <strong>{selectedChatUser.fullName}</strong> and start the conversation.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((message) => {
                        const isOwnMessage = Number(message.senderUserId) === Number(userData?.id);
                        const messageTime = message.sentAt ? new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                          <div key={message.id} className={`chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-peer'}`}>
                            <div className="chat-message-meta">
                              <span className="chat-message-name">{isOwnMessage ? 'You' : message.senderName}</span>
                              <span className="chat-message-time">{messageTime}</span>
                            </div>
                            <div className="chat-message-bubble">
                              {message.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <form className="chat-composer" onSubmit={handleSendChatMessage}>
                    <textarea
                      className="chat-composer-input"
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      onKeyDown={handleChatComposerKeyDown}
                      placeholder={selectedChatUser ? `Message ${selectedChatUser.fullName}...` : 'Select a user to start chatting'}
                      rows="3"
                      disabled={!selectedChatUser || !socketConnected}
                    />
                    <div className="chat-composer-footer">
                      <div className="chat-composer-status">
                        {chatError ? chatError : selectedChatUser ? `Chatting with ${selectedChatUser.fullName}` : 'Pick a user to begin'}
                      </div>
                      <button className="admin-btn" type="submit" disabled={!selectedChatUser || !chatDraft.trim() || chatSending || !socketConnected}>
                        {chatSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>

            <section className="card course-online-users-panel">
              <div className="section-header-inline chat-online-header">
                <div>
                  <h3>People currently in this course</h3>
                  <p className="section-subtitle">Online users for this course.</p>
                </div>
                <span className="chat-online-count">
                  <span className="online-dot" />
                  <span>{onlineUserCount} online</span>
                </span>
              </div>

              <div className="online-users-list">
                {onlineUsersLoading ? (
                  <div className="chat-empty-state chat-empty-state-tight">
                    <p className="chat-placeholder-title">Loading users</p>
                    <p className="chat-placeholder-text">Fetching who is currently online.</p>
                  </div>
                ) : onlineUsers.length === 0 ? (
                  <div className="chat-empty-state chat-empty-state-tight">
                    <p className="chat-placeholder-title">No users online</p>
                    <p className="chat-placeholder-text">Nobody else is active in this course right now.</p>
                  </div>
                ) : (
                  onlineUsers.map((user) => (
                    <div key={user.id} className="online-user-row">
                      <span className="online-dot" />
                      <div className="online-user-copy">
                        <p className="online-user-name">{user.fullName}</p>
                        <p className="online-user-role">{user.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: '',
    courseCode: '',
    description: ''
  });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseActionError, setCourseActionError] = useState('');
  const [courseActionLoading, setCourseActionLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user && user !== 'undefined') {
      try {
        setIsSignedIn(true);
        setUserData(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setAuthChecked(true);
  }, []);

  // Fetch courses and enrollments when signed in
  useEffect(() => {
    if (isSignedIn) {
      fetchCoursesAndEnrollments();
    }
  }, [isSignedIn]);

  const fetchCoursesAndEnrollments = async () => {
    setLoadingCourses(true);
    try {
      const [coursesData, enrollmentsData] = await Promise.all([
        courseService.getAllCourses(),
        courseService.getMyEnrollments(),
      ]);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await courseService.enrollCourse(courseId);
      await fetchCoursesAndEnrollments();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    try {
      await courseService.unenrollCourse(enrollmentId);
      await fetchCoursesAndEnrollments();
    } catch (error) {
      console.error('Error unenrolling:', error);
      alert('Failed to unenroll from course');
    }
  };

  const handleSignIn = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsSignedIn(true);
    setUserData(user);
  };

  const handleSignOut = async () => {
    try {
      await courseService.logout();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsSignedIn(false);
    setUserData(null);
  };

  const resetCourseForm = () => {
    setCourseForm({ name: '', courseCode: '', description: '' });
    setEditingCourseId(null);
  };

  const handleCourseFormChange = (event) => {
    const { name, value } = event.target;
    setCourseForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCourse = async (event) => {
    event.preventDefault();
    setCourseActionError('');

    if (!courseForm.name.trim() || !courseForm.courseCode.trim()) {
      setCourseActionError('Course name and code are required.');
      return;
    }

    setCourseActionLoading(true);

    try {
      if (editingCourseId) {
        await courseService.updateCourse(editingCourseId, courseForm);
      } else {
        await courseService.createCourse(courseForm);
      }
      await fetchCoursesAndEnrollments();
      resetCourseForm();
    } catch (error) {
      setCourseActionError(error.response?.data?.message || 'Course action failed.');
    } finally {
      setCourseActionLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      name: course.name || '',
      courseCode: course.courseCode || '',
      description: course.description || ''
    });
    setCourseActionError('');
  };

  const handleDeleteCourse = async (courseId) => {
    const shouldDelete = window.confirm('Delete this course? This cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    setCourseActionLoading(true);
    setCourseActionError('');

    try {
      await courseService.deleteCourse(courseId);
      await fetchCoursesAndEnrollments();
      if (editingCourseId === courseId) {
        resetCourseForm();
      }
    } catch (error) {
      setCourseActionError(error.response?.data?.message || 'Failed to delete course.');
    } finally {
      setCourseActionLoading(false);
    }
  };

  const normalizedRole = userData?.role ? userData.role.toUpperCase() : '';
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'ROLE_ADMIN';

  if (!authChecked) {
    return null;
  }

  return (
    <Router>
      <Routes>
        {isSignedIn ? (
          <>
            <Route
              path="/"
              element={(
                <Dashboard
                  isAdmin={isAdmin}
                  userData={userData}
                  normalizedRole={normalizedRole}
                  courses={courses}
                  enrollments={enrollments}
                  loadingCourses={loadingCourses}
                  courseForm={courseForm}
                  courseActionError={courseActionError}
                  courseActionLoading={courseActionLoading}
                  editingCourseId={editingCourseId}
                  handleSignOut={handleSignOut}
                  handleSaveCourse={handleSaveCourse}
                  handleCourseFormChange={handleCourseFormChange}
                  resetCourseForm={resetCourseForm}
                  handleEditCourse={handleEditCourse}
                  handleDeleteCourse={handleDeleteCourse}
                  handleEnroll={handleEnroll}
                  handleUnenroll={handleUnenroll}
                />
              )}
            />
            <Route
              path="/admin"
              element={(
                isAdmin
                  ? (
                    <Dashboard
                      isAdmin={isAdmin}
                      userData={userData}
                      normalizedRole={normalizedRole}
                      courses={courses}
                      enrollments={enrollments}
                      loadingCourses={loadingCourses}
                      courseForm={courseForm}
                      courseActionError={courseActionError}
                      courseActionLoading={courseActionLoading}
                      editingCourseId={editingCourseId}
                      handleSignOut={handleSignOut}
                      handleSaveCourse={handleSaveCourse}
                      handleCourseFormChange={handleCourseFormChange}
                      resetCourseForm={resetCourseForm}
                      handleEditCourse={handleEditCourse}
                      handleDeleteCourse={handleDeleteCourse}
                      handleEnroll={handleEnroll}
                      handleUnenroll={handleUnenroll}
                    />
                  )
                  : <Navigate to="/" />
              )}
            />
            <Route
              path="/profile"
              element={(
                <ProfilePage
                  isAdmin={isAdmin}
                  userData={userData}
                  normalizedRole={normalizedRole}
                  onSignOut={handleSignOut}
                />
              )}
            />
            <Route
              path="/courses/:courseId"
              element={(
                <CoursePage
                  isAdmin={isAdmin}
                  userData={userData}
                  courses={courses}
                  enrollments={enrollments}
                />
              )}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/signin" element={<SignIn onSignIn={handleSignIn} />} />
            <Route path="/signup" element={<SignUp onSignIn={handleSignIn} />} />
            <Route path="/" element={<Navigate to="/signin" />} />
            <Route path="*" element={<Navigate to="/signin" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
