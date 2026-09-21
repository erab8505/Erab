using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddModularReusableLabParametersAndExams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrderResults_ExamParameters_ExamParameterId",
                table: "StudyOrderResults");

            migrationBuilder.DropTable(
                name: "ExamParameters");

            migrationBuilder.DropTable(
                name: "StudyExams");

            migrationBuilder.RenameColumn(
                name: "ExamParameterId",
                table: "StudyOrderResults",
                newName: "LabParameterId");

            migrationBuilder.RenameIndex(
                name: "IX_StudyOrderResults_ExamParameterId",
                table: "StudyOrderResults",
                newName: "IX_StudyOrderResults_LabParameterId");

            migrationBuilder.AddColumn<Guid>(
                name: "LabExamId",
                table: "StudyOrderResults",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ParameterCode",
                table: "StudyOrderResults",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ParameterName",
                table: "StudyOrderResults",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "ReferenceRangeMax",
                table: "StudyOrderResults",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ReferenceRangeMin",
                table: "StudyOrderResults",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceText",
                table: "StudyOrderResults",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "StudyOrderResults",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ValueType",
                table: "StudyOrderResults",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "LabExams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SampleType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    TurnaroundHours = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabExams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LabExams_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LabParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ValueType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DefaultReferenceMin = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    DefaultReferenceMax = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    DefaultReferenceText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DefaultReagentName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DefaultReagentQuantity = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabParameters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LabParameters_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClinicalStudyExams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClinicalStudyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LabExamId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicalStudyExams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClinicalStudyExams_ClinicalStudies_ClinicalStudyId",
                        column: x => x.ClinicalStudyId,
                        principalTable: "ClinicalStudies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClinicalStudyExams_LabExams_LabExamId",
                        column: x => x.LabExamId,
                        principalTable: "LabExams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LabExamParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LabExamId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LabParameterId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CustomReferenceMin = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    CustomReferenceMax = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    CustomReferenceText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LabExamParameters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LabExamParameters_LabExams_LabExamId",
                        column: x => x.LabExamId,
                        principalTable: "LabExams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LabExamParameters_LabParameters_LabParameterId",
                        column: x => x.LabParameterId,
                        principalTable: "LabParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudyOrderResults_LabExamId",
                table: "StudyOrderResults",
                column: "LabExamId");

            migrationBuilder.CreateIndex(
                name: "IX_ClinicalStudyExams_ClinicalStudyId_LabExamId",
                table: "ClinicalStudyExams",
                columns: new[] { "ClinicalStudyId", "LabExamId" });

            migrationBuilder.CreateIndex(
                name: "IX_ClinicalStudyExams_LabExamId",
                table: "ClinicalStudyExams",
                column: "LabExamId");

            migrationBuilder.CreateIndex(
                name: "IX_LabExamParameters_LabExamId_LabParameterId",
                table: "LabExamParameters",
                columns: new[] { "LabExamId", "LabParameterId" });

            migrationBuilder.CreateIndex(
                name: "IX_LabExamParameters_LabParameterId",
                table: "LabExamParameters",
                column: "LabParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_LabExams_CompanyId_Code",
                table: "LabExams",
                columns: new[] { "CompanyId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_LabExams_CompanyId_Name",
                table: "LabExams",
                columns: new[] { "CompanyId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_LabParameters_CompanyId_Code",
                table: "LabParameters",
                columns: new[] { "CompanyId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_LabParameters_CompanyId_Name",
                table: "LabParameters",
                columns: new[] { "CompanyId", "Name" });

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrderResults_LabExams_LabExamId",
                table: "StudyOrderResults",
                column: "LabExamId",
                principalTable: "LabExams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrderResults_LabParameters_LabParameterId",
                table: "StudyOrderResults",
                column: "LabParameterId",
                principalTable: "LabParameters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrderResults_LabExams_LabExamId",
                table: "StudyOrderResults");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyOrderResults_LabParameters_LabParameterId",
                table: "StudyOrderResults");

            migrationBuilder.DropTable(
                name: "ClinicalStudyExams");

            migrationBuilder.DropTable(
                name: "LabExamParameters");

            migrationBuilder.DropTable(
                name: "LabExams");

            migrationBuilder.DropTable(
                name: "LabParameters");

            migrationBuilder.DropIndex(
                name: "IX_StudyOrderResults_LabExamId",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "LabExamId",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "ParameterCode",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "ParameterName",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "ReferenceRangeMax",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "ReferenceRangeMin",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "ReferenceText",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "StudyOrderResults");

            migrationBuilder.DropColumn(
                name: "ValueType",
                table: "StudyOrderResults");

            migrationBuilder.RenameColumn(
                name: "LabParameterId",
                table: "StudyOrderResults",
                newName: "ExamParameterId");

            migrationBuilder.RenameIndex(
                name: "IX_StudyOrderResults_LabParameterId",
                table: "StudyOrderResults",
                newName: "IX_StudyOrderResults_ExamParameterId");

            migrationBuilder.CreateTable(
                name: "StudyExams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClinicalStudyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Method = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SampleType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
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
                name: "ExamParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudyExamId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ReagentName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ReagentUsageQuantity = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    ReferenceRangeMax = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    ReferenceRangeMin = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    ReferenceText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ValueType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_ExamParameters_StudyExamId",
                table: "ExamParameters",
                column: "StudyExamId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyExams_ClinicalStudyId",
                table: "StudyExams",
                column: "ClinicalStudyId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudyOrderResults_ExamParameters_ExamParameterId",
                table: "StudyOrderResults",
                column: "ExamParameterId",
                principalTable: "ExamParameters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
