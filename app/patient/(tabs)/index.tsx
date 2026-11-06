import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { useEffect, useState } from "react";

import SearchBar from "../../../components/common/SearchBar";
import SectionHeader from "../../../components/common/SectionHeader";

import DoctorBanner from "../../../components/patient/DoctorBanner";
import DoctorCard from "../../../components/patient/DoctorCard";
import HomeHeader from "../../../components/patient/HomeHeader";
import MedicineCTA from "../../../components/patient/MedicineCTA";
import SpecialistCard from "../../../components/patient/SpecialistCard";

import {
  getDoctors,
  type Doctor,
} from "../../../services/doctor.service";

import { Colors } from "../../../constants/colors";
import { Spacing } from "../../../constants/spacing";

export default function PatientHome() {
  const [doctors, setDoctors] =
    useState<Doctor[]>([]);

  const [isLoadingDoctors, setIsLoadingDoctors] =
    useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoadingDoctors(true);

        const data = await getDoctors();

        setDoctors(data);
      } catch (error) {
        console.error(
          "Failed to load doctors on home:",
          error,
        );
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    void loadDoctors();
  }, []);

  const categories = [
    {
      name: "Eye",
      icon: "👁️",
    },
    {
      name: "Bone",
      icon: "🦴",
    },
    {
      name: "EAR",
      icon: "👂",
    },
    {
      name: "Skin",
      icon: "🧴",
    },
    {
      name: "Dentist",
      icon: "🦷",
    },
  ];

  const featuredDoctor = doctors[0];
  const nearbyDoctor = doctors[0];

  return (
    <FlatList
      data={[0]}
      keyExtractor={() => "patient-home"}
      renderItem={() => (
        <View style={styles.content}>
          {/* Header */}

          <HomeHeader
            name="Patient"
            onCartPress={() =>
              router.push(
                "/patient/cart",
              )
            }
          />

          {/* Search */}

          <View
            style={
              styles.searchSection
            }
          >
            <SearchBar
              onPress={() =>
                router.push(
                  "/search",
                )
              }
            />
          </View>

          {/* Best Doctors */}

          <SectionHeader
            title="Best Doctors"
            onSeeAll={() =>
              router.push(
                "/patient/doctors",
              )
            }
          />

          {isLoadingDoctors ? (
            <View
              style={
                styles.doctorLoading
              }
            >
              <ActivityIndicator
                size="small"
                color={
                  Colors.primary
                }
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading doctors...
              </Text>
            </View>
          ) : featuredDoctor ? (
            <DoctorBanner
              doctor={
                featuredDoctor
              }
              onPress={() =>
                router.push({
                  pathname:
                    "/doctor/[id]",
                  params: {
                    id: featuredDoctor.id,
                  },
                })
              }
            />
          ) : (
            <Text
              style={
                styles.noDoctorText
              }
            >
              No doctors available right now.
            </Text>
          )}

          {/* Specialists */}

          <View
            style={
              styles.specialistsSection
            }
          >
            <SectionHeader
              title="Specialists"
              onSeeAll={() =>
                router.push(
                  "/patient/doctors",
                )
              }
            />

            <View
              style={
                styles.horizontalWrapper
              }
            >
              <FlatList
                data={categories}
                horizontal
                keyExtractor={(
                  item,
                ) => item.name}
                showsHorizontalScrollIndicator={
                  false
                }
                nestedScrollEnabled
                contentContainerStyle={
                  styles.categoryList
                }
                renderItem={({
                  item,
                }) => (
                  <SpecialistCard
                    name={
                      item.name
                    }
                    icon={
                      item.icon
                    }
                    onPress={() =>
                      router.push({
                        pathname:
                          "/doctor/list",
                        params: {
                          category:
                            item.name,
                        },
                      })
                    }
                  />
                )}
              />
            </View>
          </View>

          {/* Doctors Near You */}

          <View
            style={
              styles.sectionSpacing
            }
          >
            <SectionHeader
              title="Doctors Near You"
              onSeeAll={() =>
                router.push(
                  "/patient/doctors",
                )
              }
            />

            {isLoadingDoctors ? (
              <View
                style={
                  styles.doctorLoading
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    Colors.primary
                  }
                />
              </View>
            ) : nearbyDoctor ? (
              <DoctorCard
                doctor={
                  nearbyDoctor
                }
                onPress={() =>
                  router.push({
                    pathname:
                      "/doctor/[id]",
                    params: {
                      id: nearbyDoctor.id,
                    },
                  })
                }
              />
            ) : (
              <Text
                style={
                  styles.noDoctorText
                }
              >
                No doctors available right now.
              </Text>
            )}
          </View>

          {/* Medicines */}

          <View
            style={
              styles.medicineSection
            }
          >
            <SectionHeader
              title="Medicines"
              onSeeAll={() =>
                router.push(
                  "/patient/medicines",
                )
              }
            />

            <MedicineCTA
              onPress={() =>
                router.push(
                  "/search",
                )
              }
            />
          </View>

          {/* Bottom space */}

          <View
            style={
              styles.bottomSpace
            }
          />
        </View>
      )}
      style={styles.list}
      contentContainerStyle={
        styles.listContent
      }
      showsVerticalScrollIndicator={
        false
      }
      nestedScrollEnabled
    />
  );
}

const styles =
  StyleSheet.create({
    list: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    listContent: {
      flexGrow: 1,
      backgroundColor:
        Colors.background,
    },

    content: {
      width: "100%",
      paddingHorizontal:
        Spacing.xl,
      paddingTop: 55,
      backgroundColor:
        Colors.background,
    },

    searchSection: {
      marginBottom:
        Spacing.xxl,
    },

    specialistsSection: {
      marginTop: Spacing.sm,
    },

    horizontalWrapper: {
      width: "100%",
    },

    categoryList: {
      paddingBottom:
        Spacing.sm,
      paddingRight:
        Spacing.sm,
    },

    sectionSpacing: {
      marginTop:
        Spacing.xxl,
    },

    medicineSection: {
      marginTop:
        Spacing.xxl,
    },

    doctorLoading: {
      minHeight: 100,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop:
        Spacing.sm,
      color:
        Colors.textSecondary,
      fontSize: 13,
    },

    noDoctorText: {
      marginTop:
        Spacing.sm,
      color:
        Colors.textSecondary,
      fontSize: 14,
    },

    bottomSpace: {
      height: 120,
    },
  });