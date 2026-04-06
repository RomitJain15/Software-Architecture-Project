import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { courseService } from './services/courseService';
import './App.css';

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
  const stompClientRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminEnrollments, setAdminEnrollments] = useState([]);
  const [adminRosterLoading, setAdminRosterLoading] = useState(false);
  const [adminRosterError, setAdminRosterError] = useState('');
  const [selectedEnrollUserId, setSelectedEnrollUserId] = useState('');
  const [selectedUnenrollEnrollmentId, setSelectedUnenrollEnrollmentId] = useState('');
  const [adminEnrollActionLoading, setAdminEnrollActionLoading] = useState(false);
  const [adminEnrollActionError, setAdminEnrollActionError] = useState('');

  const course = useMemo(
    () => courses.find((item) => item.id === parsedCourseId),
    [courses, parsedCourseId]
  );

  const isEnrolled = useMemo(
    () => enrollments.some((enrollment) => enrollment.courseId === parsedCourseId),
    [enrollments, parsedCourseId]
  );
  const shouldBlockAccess = !isAdmin && !isEnrolled;

  const loadCourseFiles = async (isMounted) => {
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
      setFiles(courseFiles);

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

    loadCourseFiles(isMounted);

    return () => {
      isMounted = false;
    };
  }, [parsedCourseId, shouldBlockAccess]);

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

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        if (!isMounted) {
          return;
        }

        client.publish({
          destination: `/app/courses/${parsedCourseId}/presence/join`,
          body: JSON.stringify({ userId: userData.id }),
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
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      isMounted = false;
      if (stompClientRef.current) {
        if (stompClientRef.current.connected) {
          stompClientRef.current.publish({
            destination: `/app/courses/${parsedCourseId}/presence/leave`,
            body: JSON.stringify({ userId: userData.id }),
          });
        }
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [parsedCourseId, userData?.id, shouldBlockAccess]);

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
      await loadCourseFiles(true);
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
      await loadCourseFiles(true);
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
      await loadCourseFiles(true);
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
      await loadCourseFiles(true);
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
                    <select
                      className="admin-select"
                      value={selectedEnrollUserId}
                      onChange={(event) => setSelectedEnrollUserId(event.target.value)}
                      disabled={adminRosterLoading || adminEnrollActionLoading}
                    >
                      <option value="">Select student</option>
                      {adminUsers
                        .filter((user) => user.role !== 'ADMIN')
                        .filter((user) => !adminEnrollments.some((enrollment) => enrollment.userId === user.id))
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} ({user.email})
                          </option>
                        ))}
                    </select>
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
                    <select
                      className="admin-select"
                      value={selectedUnenrollEnrollmentId}
                      onChange={(event) => setSelectedUnenrollEnrollmentId(event.target.value)}
                      disabled={adminRosterLoading || adminEnrollActionLoading}
                    >
                      <option value="">Select enrolled student</option>
                      {adminEnrollments.map((enrollment) => {
                        const user = adminUsers.find((item) => item.id === enrollment.userId);
                        const label = user ? `${user.fullName} (${user.email})` : `User #${enrollment.userId}`;
                        return (
                          <option key={enrollment.id} value={enrollment.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
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
                <span className="chat-session-badge">Clears on logout</span>
              </div>
              <div className="chat-placeholder">
                <p className="chat-placeholder-title">Chatbox reserved here</p>
                <p className="chat-placeholder-text">
                  This space is ready for a live course chat. Messages can stay local to the current session and be removed when the user logs out.
                </p>
              </div>
            </section>

            <section className="card course-users-panel">
              <div className="chat-header">
                <div>
                  <h3>Online Users</h3>
                  <p className="section-subtitle">People currently in this course.</p>
                </div>
                <span className="chat-session-badge">Live now</span>
              </div>
              <div className="online-list">
                {onlineUsersLoading ? (
                  <p className="section-subtitle">Loading online users...</p>
                ) : onlineUsers.length === 0 ? (
                  <p className="section-subtitle">No enrolled users with active login sessions.</p>
                ) : (
                  onlineUsers.map((user) => (
                    <div key={user.id} className="online-row">
                      <span className="online-dot" />
                      <div>
                        <p className="online-name">{user.fullName}</p>
                        <p className="online-role">{user.role}</p>
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
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<Navigate to="/signin" />} />
            <Route path="*" element={<Navigate to="/signin" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
