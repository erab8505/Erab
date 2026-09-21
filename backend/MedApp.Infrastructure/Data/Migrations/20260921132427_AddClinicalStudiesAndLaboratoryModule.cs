using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddClinicalStudiesAndLaboratoryModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClinicalStudies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PreparationInstructions = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TurnaroundTimeHours = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicalStudies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClinicalStudies_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StudyOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpecialistId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SchedulingId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OrderDate = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CompletedDate = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ClinicalDiagnosis = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudyOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudyOrders_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudyOrders_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudyOrders_Schedulings_SchedulingId",
                        column: x => x.SchedulingId,
                        principalTable: "Schedulings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_StudyOrders_Specialists_SpecialistId",
                        column: x => x.SpecialistId,
                        principalTable: "Specialists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "StudyExams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClinicalStudyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SampleType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudyExams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudyExams_ClinicalStudies_ClinicalStudyId",
                        column: x => x.ClinicalStudyId,
                        principalTable: "ClinicalStudies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudyOrderItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudyOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClinicalStudyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Observations = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudyOrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudyOrderItems_ClinicalStudies_ClinicalStudyId",
                        column: x => x.ClinicalStudyId,
                        principalTable: "ClinicalStudies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudyOrderItems_StudyOrders_StudyOrderId",
                        column: x => x.StudyOrderId,
                        principalTable: "StudyOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExamParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudyExamId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ValueType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceRangeMin = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    ReferenceRangeMax = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    ReferenceText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReagentName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ReagentUsageQuantity = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamParameters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamParameters_StudyExams_StudyExamId",
                        column: x => x.StudyExamId,
                        principalTable: "StudyExams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudyOrderResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudyOrderItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExamParameterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NumericValue = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    TextValue = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsOutOfRange = table.Column<bool>(type: "bit", nullable: false),
                    AlertLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Interpretation = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TechnicianNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudyOrderResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudyOrderResults_ExamParameters_ExamParameterId",
                        column: x => x.ExamParameterId,
                        principalTable: "ExamParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudyOrderResults_StudyOrderItems_StudyOrderItemId",
                        column: x => x.StudyOrderItemId,
                        principalTable: "StudyOrderItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClinicalStudies_CompanyId_Category",
                table: "ClinicalStudies",
                columns: new[] { "CompanyId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_ClinicalStudies_CompanyId_Code",
                table: "ClinicalStudies",
                columns: new[] { "CompanyId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_ExamParameters_StudyExamId",
                table: "ExamParameters",
                column: "StudyExamId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyExams_ClinicalStudyId",
                table: "StudyExams",
                column: "ClinicalStudyId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrderItems_ClinicalStudyId",
                table: "StudyOrderItems",
                column: "ClinicalStudyId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrderItems_StudyOrderId",
                table: "StudyOrderItems",
                column: "StudyOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrderResults_ExamParameterId",
                table: "StudyOrderResults",
                column: "ExamParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrderResults_StudyOrderItemId",
                table: "StudyOrderResults",
                column: "StudyOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrders_CompanyId_OrderNumber",
                table: "StudyOrders",
                columns: new[] { "CompanyId", "OrderNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrders_CompanyId_Status",
                table: "StudyOrders",
                columns: new[] { "CompanyId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrders_PatientId",
                table: "StudyOrders",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrders_SchedulingId",
                table: "StudyOrders",
                column: "SchedulingId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrders_SpecialistId",
                table: "StudyOrders",
                column: "SpecialistId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudyOrderResults");

            migrationBuilder.DropTable(
                name: "ExamParameters");

            migrationBuilder.DropTable(
                name: "StudyOrderItems");

            migrationBuilder.DropTable(
                name: "StudyExams");

            migrationBuilder.DropTable(
                name: "StudyOrders");

            migrationBuilder.DropTable(
                name: "ClinicalStudies");
        }
    }
}
